import asyncio
import logging
import urllib.parse
from typing import Any, Dict, List, Optional, Union

import httpx

from app.core.config import settings

logger = logging.getLogger("festival_planner.external.events")


class TicketmasterClient:
    """
    Klient do obsługi Ticketmaster Discovery API.
    """
    BASE_URL = "https://app.ticketmaster.com/discovery/v2"

    @classmethod
    async def _make_request(cls, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Główna metoda do odpytywania API z obsługą błędów (w tym błędu 429) i szczegółowym logowaniem."""
        if not settings.TICKETMASTER_API_KEY:
            logger.warning("Brak klucza TICKETMASTER_API_KEY w konfiguracji.")
            return {"error": "API key not configured for Ticketmaster"}

        url = f"{cls.BASE_URL}/{endpoint}.json"
        params["apikey"] = settings.TICKETMASTER_API_KEY

        # Bezpieczne logowanie parametrów (ukrycie klucza API w logach)
        safe_params = {k: (v if k != "apikey" else "***") for k, v in params.items()}
        logger.debug("Ticketmaster GET %s | params=%s", url, safe_params)

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(url, params=params)

                if response.status_code == 429:
                    logger.warning("Ticketmaster rate limit exceeded (429) for %s", url)
                    return {"error": "Rate limit exceeded. Please try again later."}

                response.raise_for_status()
                data = response.json()
                logger.debug("Ticketmaster response %d | keys=%s", response.status_code, list(data.keys()))
                return data
            except httpx.HTTPStatusError as e:
                logger.error("Ticketmaster HTTP status error: status=%s, url=%s, body=%s", e.response.status_code, url, e.response.text[:200])
                return {"error": f"Nie udało się pobrać danych z serwisu Ticketmaster (status {e.response.status_code})."}
            except httpx.RequestError as e:
                logger.error("Ticketmaster Request error for %s: %s", url, e)
                return {"error": "Nie udało się połączyć z serwisem Ticketmaster, spróbuj ponownie."}

    @staticmethod
    def _format_to_iso8601(date_str: Optional[str], is_end_of_day: bool = False) -> Optional[str]:
        """Konwertuje ciąg daty (np. 'YYYY-MM-DD' lub 'YYYY-MM-DDTHH:mm:ss') do formatu ISO 8601 wymaganego przez Ticketmaster (YYYY-MM-DDTHH:mm:ssZ)."""
        if not date_str:
            return None
        s = date_str.strip()
        if not s:
            return None
        if "T" in s:
            if s.endswith("Z") or "+" in s:
                return s
            return f"{s}Z"
        if len(s) == 10 and s[4] == "-" and s[7] == "-":
            return f"{s}T23:59:59Z" if is_end_of_day else f"{s}T00:00:00Z"
        return s

    @classmethod
    async def search_events(
        cls,
        keyword: Optional[str] = None,
        city: Optional[str] = None,
        country_code: Optional[str] = "PL",
        latlong: Optional[str] = None,
        radius: Optional[Union[int, float]] = None,
        unit: Optional[str] = "km",
        classification_name: Optional[str] = None,
        segment_id: Optional[str] = None,
        start_date_time: Optional[str] = None,
        end_date_time: Optional[str] = None,
        page: int = 0,
        size: int = 20
    ) -> Dict[str, Any]:
        """Szuka wydarzeń na podstawie wielu kryteriów, z obsługą formatowania dat ISO 8601 oraz fallbackiem dla Europy."""
        # Check if searching across Europe
        is_europe = (
            (country_code and country_code.strip().lower() == "europe") or
            (city and city.strip().lower() == "europe")
        )

        if is_europe:
            europe_countries = ["PL", "DE", "GB", "FR", "ES", "NL", "CZ"]
            logger.info("Ticketmaster: searching across Europe (%d countries)", len(europe_countries))
            
            sem = asyncio.Semaphore(3)
            async def fetch_for_country(cc: str):
                async with sem:
                    await asyncio.sleep(0.2)
                    return await cls.search_events(
                        keyword=keyword,
                        city=None if (city and city.strip().lower() == "europe") else city,
                        country_code=cc,
                        latlong=latlong,
                        radius=radius,
                        unit=unit,
                        classification_name=classification_name,
                        segment_id=segment_id,
                        start_date_time=start_date_time,
                        end_date_time=end_date_time,
                        page=page,
                        size=max(5, size // len(europe_countries) + 2)
                    )

            tasks = [fetch_for_country(cc) for cc in europe_countries]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            combined_events = []
            for r in results:
                if isinstance(r, dict) and "_embedded" in r and "events" in r["_embedded"]:
                    combined_events.extend(r["_embedded"]["events"])
            
            # Sort combined events by date if possible
            combined_events.sort(
                key=lambda x: (x.get("dates", {}).get("start", {}).get("dateTime") or "9999")
            )
            trimmed_events = combined_events[:size]
            return {
                "_embedded": {"events": trimmed_events} if trimmed_events else {},
                "page": {"totalElements": len(trimmed_events), "size": size, "number": page}
            }

        params: Dict[str, Any] = {
            "page": page,
            "size": size
        }
        if keyword and keyword.strip():
            params["keyword"] = keyword.strip()
        if classification_name and classification_name.strip():
            params["classificationName"] = classification_name.strip()
        if segment_id and segment_id.strip():
            params["segmentId"] = segment_id.strip()

        if latlong and latlong.strip():
            # Kiedy wyszukujemy po współrzędnych (latlong), Ticketmaster API zwraca błąd 400 Bad Request,
            # jeśli jednocześnie podane jest countryCode lub jeśli radius ma format zmiennoprzecinkowy z kropek (np. "500.0").
            params["latlong"] = latlong.strip()
            if radius is not None:
                try:
                    params["radius"] = str(int(round(float(radius))))
                except (ValueError, TypeError):
                    params["radius"] = str(radius)
                params["unit"] = unit or "km"
        else:
            if country_code and country_code.strip() and country_code.strip().lower() != "all":
                params["countryCode"] = country_code.strip().upper()
            if city and city.strip():
                params["city"] = city.strip()
            if radius is not None:
                try:
                    params["radius"] = str(int(round(float(radius))))
                except (ValueError, TypeError):
                    params["radius"] = str(radius)
                params["unit"] = unit or "km"

        start_iso = cls._format_to_iso8601(start_date_time, is_end_of_day=False)
        end_iso = cls._format_to_iso8601(end_date_time, is_end_of_day=True)
        if start_iso:
            params["startDateTime"] = start_iso
        if end_iso:
            params["endDateTime"] = end_iso

        return await cls._make_request("events", params)

    @classmethod
    async def search_attractions(cls, keyword: str, size: int = 5) -> Dict[str, Any]:
        """
        Wyszukuje artystów/zespoły (Attractions). 
        Zwraca szczegóły artysty oraz linki do mediów społecznościowych.
        """
        params = {
            "keyword": keyword,
            "size": size
        }
        return await cls._make_request("attractions", params)

    @classmethod
    async def search_venues(cls, keyword: str, country_code: str = "PL", size: int = 5) -> Dict[str, Any]:
        """
        Wyszukuje obiekty/miejsca (Venues). 
        Zwraca dokładny adres i współrzędne geograficzne.
        """
        params = {
            "keyword": keyword,
            "countryCode": country_code,
            "size": size
        }
        return await cls._make_request("venues", params)


class SongkickClient:
    """
    Klient opcjonalny do obsługi Songkick API (jako płatny fallback dla koncertów).
    Dokumentacja: https://www.songkick.com/developer
    """
    BASE_URL = "https://api.songkick.com/api/3.0"

    @classmethod
    async def search_events(cls, query: str) -> Dict[str, Any]:
        if not settings.SONGKICK_API_KEY:
            logger.warning("Brak klucza SONGKICK_API_KEY w konfiguracji.")
            return {"error": "API key not configured for Songkick"}

        url = f"{cls.BASE_URL}/events.json"
        params = {"apikey": settings.SONGKICK_API_KEY, "query": query}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error("Songkick API HTTP status error: status=%s, query=%s, body=%s", e.response.status_code, query, e.response.text[:200])
                return {"error": "Nie udało się pobrać danych o wydarzeniach z Songkick, spróbuj ponownie."}
            except httpx.RequestError as e:
                logger.error("Songkick API network error for query=%s: %s", query, e)
                return {"error": "Nie udało się połączyć z serwisem Songkick, spróbuj ponownie."}
