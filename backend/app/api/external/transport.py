import logging
from typing import Optional, Any, Dict, List
import httpx
from app.core.config import settings

logger = logging.getLogger("festival_planner.external.transport")


class PolishTransportClient:
    """
    Klient do obsługi polskich pociągów PKP i transportu (Otwarte Dane PKP PLK & poland.transport.rest).
    Dokumentacja: https://pdp-api.plk-sa.pl / https://poland.transport.rest
    """
    @classmethod
    async def search_stations(cls, query: str) -> List[Dict[str, Any]]:
        """
        Wyszukuje stacje kolejowe w Polsce używając community REST API poland.transport.rest.
        """
        url = f"{settings.POLAND_TRANSPORT_URL}/locations"
        params = {"query": query, "poi": "false", "addresses": "false"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()

    @classmethod
    async def get_connections(
        cls,
        from_station: str,
        to_station: str,
        departure_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Wyszukuje połączenia pociągów pomiędzy stacjami w poland.transport.rest lub oficjalnym API PKP.
        """
        url = f"{settings.POLAND_TRANSPORT_URL}/journeys"
        params: Dict[str, Any] = {
            "from": from_station,
            "to": to_station,
            "results": 5
        }
        if departure_time:
            params["departure"] = departure_time
            
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
