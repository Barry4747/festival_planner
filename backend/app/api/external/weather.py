import logging
from typing import Optional, Any, Dict, List
import httpx
from app.core.config import settings

logger = logging.getLogger("festival_planner.external.weather")


class OpenMeteoClient:
    """
    Klient do obsługi darmowego API pogodowego Open-Meteo (dla Europy i świata, bez klucza API).
    Dokumentacja: https://open-meteo.com/
    """
    @classmethod
    async def get_forecast(
        cls,
        latitude: float,
        longitude: float,
        days: int = 7,
        hourly: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        if hourly is None:
            hourly = ["temperature_2m", "precipitation_probability", "rain", "weathercode", "windspeed_10m"]
        
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": ",".join(hourly),
            "forecast_days": days,
            "timezone": "auto"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(settings.OPEN_METEO_URL, params=params)
            response.raise_for_status()
            return response.json()
