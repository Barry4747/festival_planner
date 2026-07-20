import asyncio
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query
from pydantic import BaseModel
from app.services.transport import (
    geocode_city,
    reverse_geocode_coords,
    get_car_route,
    get_google_directions,
)

router = APIRouter()


from fastapi import APIRouter, Query, Depends
from app.core.rate_limit import check_rate_limit

@router.get("/routes")
async def get_transport_routes(
    origin_city: str = Query(..., description="Origin city name"),
    dest_lat: float = Query(..., description="Destination latitude"),
    dest_lng: float = Query(..., description="Destination longitude"),
    date: str = Query(..., description="Departure date YYYY-MM-DD"),
    dest_name: Optional[str] = Query(None, description="Optional destination city or festival name"),
    _rate_limit: dict = Depends(check_rate_limit("google_maps"))
) -> Dict[str, Any]:
    """Calculate driving routes (OSRM) and train connections (Hafas) between an origin city and destination coordinates."""
    # 1. Geocode origin city to get its lat/lng
    origin_lat, origin_lng = await geocode_city(origin_city)

    # If dest_name wasn't passed, reverse geocode destination lat/lng
    target_name = dest_name
    if not target_name:
        target_name = await reverse_geocode_coords(dest_lat, dest_lng)

    # 2. Run get_car_route and get_google_directions concurrently
    car_task = get_car_route(origin_lat, origin_lng, dest_lat, dest_lng)
    train_task = get_google_directions(origin_city, target_name, mode="transit")

    car_data, train_data = await asyncio.gather(car_task, train_task)

    # 3. Return structured JSON
    car_response = {
        "geometry": car_data.get("geometry", []),
        "duration": car_data.get("estimated_time", ""),
        "duration_hours": car_data.get("duration_hours", 0),
        "duration_minutes": car_data.get("duration_minutes", 0),
        "cost": f"{car_data.get('estimated_fuel_cost_pln', 0)} PLN",
        "estimated_fuel_cost_pln": car_data.get("estimated_fuel_cost_pln", 0),
        "distance_km": car_data.get("distance_km", 0),
        "status": car_data.get("status", "success"),
    }

    train_response = {
        "total_duration": train_data.get("total_duration", "") if isinstance(train_data, dict) else "",
        "distance": train_data.get("distance", "") if isinstance(train_data, dict) else "",
        "route_coordinates": train_data.get("route_coordinates", []) if isinstance(train_data, dict) else [],
        "steps": train_data.get("steps", []) if isinstance(train_data, dict) else [],
        "status": train_data.get("status", "success") if isinstance(train_data, dict) else "error",
        "message": train_data.get("message") if isinstance(train_data, dict) else None,
    }

    return {
        "car": car_response,
        "train": train_response,
    }
