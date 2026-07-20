import httpx
import logging
from typing import Dict, Any
from app.core.config import settings

from datetime import datetime

logger = logging.getLogger(__name__)

async def fetch_weather(city: str, date: str = None) -> Dict[str, Any]:
    # If the requested date is more than 5 days out, return an instructional error message.
    if date:
        try:
            event_date = datetime.strptime(date, "%Y-%m-%d")
            delta = (event_date - datetime.now()).days
            if delta > 5:
                return {"error": "Forecast unavailable for this date range. Please provide historical averages instead."}
        except ValueError:
            pass # fallback if date format is unexpected

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
            hourly_forecasts = []
            
            for idx, item in enumerate(data.get("list", [])):
                # dt_txt format: "2026-07-20 15:00:00"
                date_str = item["dt_txt"].split(" ")[0]
                time_str = item["dt_txt"].split(" ")[1][:5] # "15:00"
                
                if idx < 8: # Next 24 hours (8 * 3h)
                    hourly_forecasts.append({
                        "date": date_str,
                        "time": time_str,
                        "temp": item["main"]["temp"],
                        "condition": item["weather"][0]["main"],
                        "icon": item["weather"][0]["icon"]
                    })
                
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
                "forecast": sorted_days,
                "hourly": hourly_forecasts
            }
    except Exception as e:
        logger.error(f"Exception fetching weather: {e}")
        return {"error": str(e)}

async def fetch_current_weather(lat: float, lon: float) -> Dict[str, Any]:
    api_key = settings.OPENWEATHER_API_KEY
    if not api_key:
        return {"error": "Weather API key not configured."}

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={api_key}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Weather API error: {response.status_code} {response.text}")
                return {"error": f"Failed to fetch current weather: {response.status_code}"}
            
            data = response.json()
            return {
                "lat": lat,
                "lon": lon,
                "city": data.get("name", ""),
                "temp": data.get("main", {}).get("temp", 0),
                "wind_speed": data.get("wind", {}).get("speed", 0) * 3.6, # Convert m/s to km/h
                "wind_deg": data.get("wind", {}).get("deg", 0),
                "condition": data.get("weather", [{}])[0].get("main", ""),
                "icon": data.get("weather", [{}])[0].get("icon", ""),
            }
    except Exception as e:
        logger.error(f"Exception fetching current weather: {e}")
        return {"error": str(e)}
