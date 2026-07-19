import httpx
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

async def fetch_weather(city: str) -> Dict[str, Any]:
    api_key = settings.OPENWEATHER_API_KEY
    if not api_key:
        logger.error("OPENWEATHER_API_KEY is not set.")
        return {"error": "Weather API key not configured."}

    url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&units=metric&appid={api_key}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Weather API error: {response.status_code} {response.text}")
                return {"error": f"Failed to fetch weather: {response.status_code}"}
            
            data = response.json()
            
            # Group 3-hour chunks into daily summary (max 5 days)
            daily_forecasts = {}
            for item in data.get("list", []):
                # dt_txt format: "2026-07-20 15:00:00"
                date_str = item["dt_txt"].split(" ")[0]
                
                if date_str not in daily_forecasts:
                    daily_forecasts[date_str] = {
                        "date": date_str,
                        "min_temp": item["main"]["temp_min"],
                        "max_temp": item["main"]["temp_max"],
                        "condition": item["weather"][0]["main"],
                        "icon": item["weather"][0]["icon"]
                    }
                else:
                    daily_forecasts[date_str]["min_temp"] = min(daily_forecasts[date_str]["min_temp"], item["main"]["temp_min"])
                    daily_forecasts[date_str]["max_temp"] = max(daily_forecasts[date_str]["max_temp"], item["main"]["temp_max"])
            
            # Sort and limit to 5 days
            sorted_days = sorted(list(daily_forecasts.values()), key=lambda x: x["date"])[:5]
            
            return {
                "city": data.get("city", {}).get("name", city),
                "forecast": sorted_days
            }
    except Exception as e:
        logger.error(f"Exception fetching weather: {e}")
        return {"error": str(e)}
