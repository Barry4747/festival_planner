import logging
from typing import Optional, Any, Dict, List
import urllib.parse
import httpx
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger("festival_planner.external.events")


class BandsintownClient:
    """
    Kompletny klient do obsługi publicznego Bandsintown API.
    Dokumentacja: https://artists.bandsintown.com/support/public-api
    """
    BASE_URL = "https://rest.bandsintown.com"

    @staticmethod
    def _build_artist_path(identifier: str, id_type: str = "name") -> str:
        """Helper do budowania ścieżki w zależności od typu identyfikatora."""
        if id_type == "bandsintown_id":
            return f"id_{identifier}"
        elif id_type == "facebook_id":
            return f"fbid_{identifier}"
        else:
            # Domyślnie wyszukiwanie po nazwie, która wymaga URL encodingu
            return urllib.parse.quote(identifier, safe='')

    @classmethod
    async def get_artist_info(
        cls, 
        identifier: str, 
        id_type: str = "name"
    ) -> Optional[Dict[str, Any]]:
        """
        Pobiera informacje o artyście.
        id_type może przyjmować wartości: 'name', 'bandsintown_id', 'facebook_id'.
        """
        artist_path = cls._build_artist_path(identifier, id_type)
        url = f"{cls.BASE_URL}/artists/{artist_path}"
        params = {"app_id": settings.BANDSINTOWN_APP_ID}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                
                if not response.text.strip():
                    return None
                    
                data = response.json()
                if "error" in data:
                    return None
                    
                return data
            except httpx.HTTPError as e:
                print(f"BandsintownClient Error [info]: {e}")
                return None

    @classmethod
    async def get_artist_events(
        cls,
        identifier: str,
        id_type: str = "name",
        date_range: str = "upcoming"
    ) -> List[Dict[str, Any]]:
        """
        Pobiera wydarzenia artysty. 
        date_range może przyjmować np. 'upcoming', 'past', 'all' lub zakres dat.
        """
        artist_path = cls._build_artist_path(identifier, id_type)
        url = f"{cls.BASE_URL}/artists/{artist_path}/events"
        params = {"app_id": settings.BANDSINTOWN_APP_ID, "date": date_range}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                
                if not response.text.strip():
                    return []
                    
                data = response.json()
                
                if isinstance(data, list):
                    return data
                return []
            except httpx.HTTPError as e:
                print(f"BandsintownClient Error [events]: {e}")
                return []

    # --- Generatory Linków Akcji (Calls to Action) ---
    
    @staticmethod
    def generate_track_link(artist_url: str) -> str:
        """
        Dodaje parametr śledzenia (Track) do bazowego URL artysty z API.
        """
        separator = "&" if "?" in artist_url else "?"
        return f"{artist_url}{separator}trigger=track"

    @staticmethod
    def generate_rsvp_link(event_url: str) -> str:
        """
        Dodaje parametr 'RSVP' do bazowego URL wydarzenia z API.
        Używane, gdy wydarzenie ma dostępne opcje biletów.
        """
        separator = "&" if "?" in event_url else "?"
        return f"{event_url}{separator}trigger=rsvp_going"

    @staticmethod
    def generate_notify_me_link(event_url: str) -> str:
        """
        Dodaje parametr 'Notify Me' do bazowego URL wydarzenia z API.
        Używane, gdy wydarzenie nie ma jeszcze dostępnych biletów (pusta tablica 'offers').
        """
        separator = "&" if "?" in event_url else "?"
        return f"{event_url}{separator}trigger=notify_me"


class TicketmasterClient:
    """
    Klient do obsługi Ticketmaster Discovery API (szerokie pokrycie mainstreamowych eventów).
    Dokumentacja: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
    """
    BASE_URL = "https://app.ticketmaster.com/discovery/v2"

    @classmethod
    async def search_events(
        cls,
        keyword: Optional[str] = None,
        city: Optional[str] = None,
        country_code: str = "PL",
        start_date_time: Optional[str] = None,
        end_date_time: Optional[str] = None,
        page: int = 0,
        size: int = 20
    ) -> Dict[str, Any]:
        if not settings.TICKETMASTER_API_KEY:
            logger.warning("Brak klucza TICKETMASTER_API_KEY w konfiguracji.")
            return {"error": "API key not configured for Ticketmaster"}

        url = f"{cls.BASE_URL}/events.json"
        params: Dict[str, Any] = {
            "apikey": settings.TICKETMASTER_API_KEY,
            "countryCode": country_code,
            "page": page,
            "size": size
        }
        if keyword:
            params["keyword"] = keyword
        if city:
            params["city"] = city
        if start_date_time:
            params["startDateTime"] = start_date_time
        if end_date_time:
            params["endDateTime"] = end_date_time

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()


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
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
