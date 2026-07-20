import asyncio
import datetime
import logging
import math
from typing import Any, Dict, List, Tuple
import httpx
import polyline
import os

logger = logging.getLogger("festival_planner.services.transport")

# Fuel cost assumptions
DEFAULT_FUEL_CONSUMPTION_L_PER_100KM = 8.0
DEFAULT_FUEL_PRICE_PLN_PER_LITER = 6.50


def _calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Standard Haversine distance formula returning kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


async def geocode_city(city_name: str) -> Tuple[float, float]:
    """Geocode a city name to (latitude, longitude) using OpenStreetMap Nominatim API."""
    city_clean = city_name.strip()
    if not city_clean:
        return (52.2297, 21.0122)  # Default Warsaw

    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": city_clean, "format": "json", "limit": 1}
    headers = {"User-Agent": "FestivalPlannerApp/1.0 (contact@festivalplanner.app)"}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    lat = float(data[0].get("lat", 0.0))
                    lon = float(data[0].get("lon", 0.0))
                    logger.info(f"📍 [geocode_city] Geocoded '{city_name}' -> ({lat}, {lon})")
                    return (lat, lon)
    except Exception as e:
        logger.warning(f"⚠️ [geocode_city] Nominatim lookup failed for '{city_name}': {e}")

    # Common fallbacks if API is unreachable
    city_lower = city_clean.lower()
    fallbacks = {
        "warsaw": (52.2297, 21.0122),
        "warszawa": (52.2297, 21.0122),
        "krakow": (50.0647, 19.9450),
        "kraków": (50.0647, 19.9450),
        "gdansk": (54.3520, 18.6466),
        "gdańsk": (54.3520, 18.6466),
        "gdynia": (54.5189, 18.5305),
        "katowice": (50.2649, 19.0238),
        "poznan": (52.4064, 16.9252),
        "poznań": (52.4064, 16.9252),
        "wroclaw": (51.1079, 17.0385),
        "wrocław": (51.1079, 17.0385),
        "plock": (52.5463, 19.7065),
        "płock": (52.5463, 19.7065),
        "czaplinek": (53.5550, 16.2333),
        "berlin": (52.5200, 13.4050),
        "paris": (48.8566, 2.3522),
        "london": (51.5074, -0.1278),
    }
    if city_lower in fallbacks:
        return fallbacks[city_lower]

    return (52.2297, 21.0122)


async def reverse_geocode_coords(lat: float, lon: float) -> str:
    """Reverse geocode (lat, lon) to a city/town/village name using OpenStreetMap Nominatim API."""
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {"lat": lat, "lon": lon, "format": "json"}
    headers = {"User-Agent": "FestivalPlannerApp/1.0 (contact@festivalplanner.app)"}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                address = data.get("address", {})
                city = (
                    address.get("city")
                    or address.get("town")
                    or address.get("village")
                    or address.get("municipality")
                    or data.get("name")
                    or "Festival City"
                )
                logger.info(f"📍 [reverse_geocode_coords] Reverse geocoded ({lat}, {lon}) -> '{city}'")
                return city
    except Exception as e:
        logger.warning(f"⚠️ [reverse_geocode_coords] Reverse lookup failed for ({lat}, {lon}): {e}")

    return "Festival City"


async def get_car_route(lat1: float, lon1: float, lat2: float, lon2: float) -> Dict[str, Any]:
    """Calculate driving distance and estimated time using public OSRM driving route API with full GeoJSON geometry."""
    url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}"
    params = {"overview": "full", "geometries": "geojson"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and "routes" in data and len(data["routes"]) > 0:
                    route = data["routes"][0]
                    duration_sec = float(route.get("duration", 0))
                    distance_meters = float(route.get("distance", 0))

                    distance_km = round(distance_meters / 1000.0, 1)
                    hours = int(duration_sec // 3600)
                    minutes = int((duration_sec % 3600) // 60)
                    time_str = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

                    fuel_cost_pln = round(distance_km * (DEFAULT_FUEL_CONSUMPTION_L_PER_100KM / 100.0) * DEFAULT_FUEL_PRICE_PLN_PER_LITER, 2)

                    geometry = route.get("geometry", {})
                    raw_coords = geometry.get("coordinates", [])
                    # OSRM returns [lng, lat], swap to [lat, lng] for Leaflet map
                    swapped_coords = [
                        [float(coord[1]), float(coord[0])]
                        for coord in raw_coords
                        if isinstance(coord, list) and len(coord) >= 2
                    ]

                    logger.info(f"🚗 [get_car_route] OSRM success: {distance_km} km, {time_str}, {len(swapped_coords)} points")
                    return {
                        "mode": "car",
                        "status": "success",
                        "distance_km": distance_km,
                        "estimated_time": time_str,
                        "duration_hours": hours,
                        "duration_minutes": minutes,
                        "estimated_fuel_cost_pln": fuel_cost_pln,
                        "fuel_assumptions": f"{DEFAULT_FUEL_CONSUMPTION_L_PER_100KM}L/100km @ {DEFAULT_FUEL_PRICE_PLN_PER_LITER:.2f} PLN/L",
                        "geometry": swapped_coords,
                    }
    except Exception as e:
        logger.warning(f"⚠️ [get_car_route] OSRM API failed, using fallback calculation: {e}")

    # Fallback if OSRM is temporarily overloaded or unreachable
    distance_km = round(_calculate_haversine_km(lat1, lon1, lat2, lon2) * 1.25, 1)  # road factor ~1.25x haversine
    duration_hours_float = distance_km / 85.0  # average speed 85 km/h
    hours = int(duration_hours_float)
    minutes = int((duration_hours_float - hours) * 60)
    time_str = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
    fuel_cost_pln = round(distance_km * (DEFAULT_FUEL_CONSUMPTION_L_PER_100KM / 100.0) * DEFAULT_FUEL_PRICE_PLN_PER_LITER, 2)

    return {
        "mode": "car",
        "status": "fallback_estimated",
        "distance_km": distance_km,
        "estimated_time": time_str,
        "duration_hours": hours,
        "duration_minutes": minutes,
        "estimated_fuel_cost_pln": fuel_cost_pln,
        "fuel_assumptions": f"{DEFAULT_FUEL_CONSUMPTION_L_PER_100KM}L/100km @ {DEFAULT_FUEL_PRICE_PLN_PER_LITER:.2f} PLN/L",
        "geometry": [[float(lat1), float(lon1)], [float(lat2), float(lon2)]],
    }


async def get_google_directions(
    origin: str,
    destination: str,
    mode: str = "transit"
) -> Dict[str, Any]:
    # Sanitize inputs to prevent API NOT_FOUND errors from messy LLM strings
    clean_origin = origin.split('|')[0].replace('pass', '').replace('2-day', '').strip() if origin else origin
    clean_destination = destination.split('|')[0].replace('pass', '').replace('2-day', '').strip() if destination else destination

    from app.core.config import settings
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        logger.error("❌ [get_google_directions] Missing GOOGLE_MAPS_API_KEY in configuration.")
        return {"status": "error", "message": "Google Maps API key is missing."}

    url = f"https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": clean_origin,
        "destination": clean_destination,
        "mode": mode,
        "key": api_key
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, timeout=15.0)
            if resp.status_code != 200:
                logger.warning(f"⚠️ [get_google_directions] HTTP {resp.status_code}: {resp.text}")
                return {"status": "error", "message": "Google Directions API is temporarily unavailable."}
            data = resp.json()
            logger.warning(f"data: {data}")
            if data.get("status") != "OK" or not data.get("routes"):
                err_status = data.get("status", "Unknown Error")
                logger.warning(f"⚠️ [get_google_directions] API returned {err_status} for {origin} to {destination}")
                return {"status": "error", "message": f"Could not find a transit route from {origin} to {destination}."}

            route = data["routes"][0]
            leg = route["legs"][0]

            duration_str = leg.get("duration", {}).get("text", "Unknown")
            distance_str = leg.get("distance", {}).get("text", "Unknown")
            
            parsed_steps = []
            for step in leg.get("steps", []):
                step_mode = step.get("travel_mode", "UNKNOWN")
                poly_points = step.get("polyline", {}).get("points", "")
                step_coords = polyline.decode(poly_points) if poly_points else []
                
                if step_mode == "WALKING":
                    parsed_steps.append({
                        "mode": "WALKING",
                        "duration": step.get("duration", {}).get("text", ""),
                        "instruction": step.get("html_instructions", ""),
                        "polyline": step_coords
                    })
                elif step_mode == "TRANSIT":
                    transit_details = step.get("transit_details", {})
                    line = transit_details.get("line", {})
                    parsed_steps.append({
                        "mode": line.get("vehicle", {}).get("type", "TRANSIT"),
                        "line_name": line.get("short_name") or line.get("name") or "Transit",
                        "color": line.get("color", "#3b82f6"),
                        "departure_stop": transit_details.get("departure_stop", {}).get("name", ""),
                        "departure_time": transit_details.get("departure_time", {}).get("text", ""),
                        "arrival_stop": transit_details.get("arrival_stop", {}).get("name", ""),
                        "arrival_time": transit_details.get("arrival_time", {}).get("text", ""),
                        "duration": step.get("duration", {}).get("text", ""),
                        "polyline": step_coords,
                        "start_location": [
                            step.get("start_location", {}).get("lat", 0),
                            step.get("start_location", {}).get("lng", 0)
                        ]
                    })
                else:
                    parsed_steps.append({
                        "mode": step_mode,
                        "duration": step.get("duration", {}).get("text", ""),
                        "instruction": step.get("html_instructions", ""),
                        "polyline": step_coords
                    })

            overview_polyline_points = route.get("overview_polyline", {}).get("points", "")
            route_coords = polyline.decode(overview_polyline_points) if overview_polyline_points else []

            logger.info(f"🚆 [get_google_directions] Success: {origin} -> {destination} | {duration_str}")

            return {
                "status": "success",
                "total_duration": duration_str,
                "distance": distance_str,
                "steps": parsed_steps,
                "route_coordinates": route_coords
            }

    except Exception as e:
        logger.warning(f"⚠️ [get_google_directions] Query failed: {e}")
        return {"status": "error", "message": "Transit routing is temporarily unavailable due to a network error."}
