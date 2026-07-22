import logging
from typing import Optional, Any, Dict
import httpx
from app.core.config import settings

logger = logging.getLogger("festival_planner.external.maps")


class GoogleMapsClient:
    """
    Klient do obsługi Google Maps Platform (Trasy, geokodowanie i czas przejścia/przejazdu).
    """
    BASE_URL = "https://maps.googleapis.com/maps/api"

    @classmethod
    async def get_directions(
        cls,
        origin: str,
        destination: str,
        mode: str = "transit",
        departure_time: str = "now"
    ) -> Dict[str, Any]:
        if not settings.GOOGLE_MAPS_API_KEY:
            logger.warning("Brak klucza GOOGLE_MAPS_API_KEY w konfiguracji.")
            return {"error": "API key not configured for Google Maps"}

        url = f"{cls.BASE_URL}/directions/json"
        params = {
            "origin": origin,
            "destination": destination,
            "mode": mode,
            "departure_time": departure_time,
            "key": settings.GOOGLE_MAPS_API_KEY
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error("Google Maps API HTTP status error: status=%s, origin=%s, destination=%s, body=%s", e.response.status_code, origin, destination, e.response.text[:200])
                return {"error": "Nie udało się pobrać danych o trasie, spróbuj ponownie."}
            except httpx.RequestError as e:
                logger.error("Google Maps API network error for origin=%s to destination=%s: %s", origin, destination, e)
                return {"error": "Nie udało się połączyć z serwisem Google Maps, spróbuj ponownie."}
