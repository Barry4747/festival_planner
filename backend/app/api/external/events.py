import logging
from typing import Optional, Any, Dict, List
import urllib.parse
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
        print(f"\n🌐 [TICKETMASTER HTTP REQUEST] GET {url} | Params: {safe_params}")
        logger.info(f"🌐 [TICKETMASTER HTTP REQUEST] GET {url} | Params: {safe_params}")

        # Ticketmaster zazwyczaj nie wymaga spoofingu User-Agent, ale go zostawiamy dla spójności
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(url, params=params)
                
                # Przechwytywanie przekroczenia limitu zapytań (kod 429) z dokumentacji
                if response.status_code == 429:
                    msg = "Przekroczono limit Ticketmaster API (429 Too Many Requests)."
                    print(f"❌ [TICKETMASTER HTTP ERROR] {msg}")
                    logger.warning(msg)
                    return {"error": "Rate limit exceeded. Please try again later."}
                    
                response.raise_for_status()
                data = response.json()
                print(f"🌐 [TICKETMASTER HTTP RESPONSE] Status: {response.status_code} OK | Keys in response: {list(data.keys())}")
                logger.info(f"🌐 [TICKETMASTER HTTP RESPONSE] Status: {response.status_code} OK")
                return data
            except httpx.HTTPError as e:
                print(f"❌ [TICKETMASTER HTTP ERROR] {e}")
                logger.error(f"Błąd Ticketmaster API: {e}")
                return {"error": str(e)}

    @classmethod
    async def search_events(
        cls,
        keyword: Optional[str] = None,
        city: Optional[str] = None,
        country_code: str = "PL",
        latlong: Optional[str] = None,
        classification_name: Optional[str] = None,
        start_date_time: Optional[str] = None,
        end_date_time: Optional[str] = None,
        page: int = 0,
        size: int = 20
    ) -> Dict[str, Any]:
        """Szuka wydarzeń na podstawie wielu kryteriów."""
        params: Dict[str, Any] = {
            "countryCode": country_code,
            "page": page,
            "size": size
        }
        if keyword:
            params["keyword"] = keyword
        if city:
            params["city"] = city
        if latlong:
            params["latlong"] = latlong  # Np. "52.2297,21.0122"
        if classification_name:
            params["classificationName"] = classification_name # Np. "Rock", "Electronic"
        if start_date_time:
            params["startDateTime"] = start_date_time
        if end_date_time:
            params["endDateTime"] = end_date_time

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
        
        async with httpx.AsyncClient(timeout=10.0, headers=cls.HEADERS) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
