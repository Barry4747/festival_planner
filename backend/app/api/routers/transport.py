"""Transport router — car and train route calculation."""
import asyncio
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query

from app.core.rate_limit import check_rate_limit
from app.core.supabase import get_current_user
from app.services.transport import (
    geocode_city,
    get_car_route,
    get_google_directions,
    reverse_geocode_coords,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/routes")
async def get_transport_routes(
    origin_city: str = Query(..., description="Origin city name"),
    dest_lat: float = Query(..., description="Destination latitude"),
    dest_lng: float = Query(..., description="Destination longitude"),
    date: str = Query(..., description="Departure date YYYY-MM-DD"),
    dest_name: Optional[str] = Query(None, description="Optional destination city or festival name"),
    user: Dict[str, Any] = Depends(get_current_user),
    _rate_limit: dict = Depends(check_rate_limit("google_maps")),
) -> Dict[str, Any]:
    """Calculate driving (OSRM) and transit (Google Directions) routes from an
    origin city to festival destination coordinates."""

    origin_lat, origin_lng = await geocode_city(origin_city)

    target_name = dest_name or await reverse_geocode_coords(dest_lat, dest_lng)

    car_data, train_data = await asyncio.gather(
        get_car_route(origin_lat, origin_lng, dest_lat, dest_lng),
        get_google_directions(origin_city, target_name, mode="transit"),
    )

    car_response: Dict[str, Any] = {
        "geometry": car_data.get("geometry", []),
        "duration": car_data.get("estimated_time", ""),
        "duration_hours": car_data.get("duration_hours", 0),
        "duration_minutes": car_data.get("duration_minutes", 0),
        "cost": f"{car_data.get('estimated_fuel_cost_pln', 0)} PLN",
        "estimated_fuel_cost_pln": car_data.get("estimated_fuel_cost_pln", 0),
        "distance_km": car_data.get("distance_km", 0),
        "status": car_data.get("status", "success"),
    }

    train_response: Dict[str, Any] = {
        "total_duration": train_data.get("total_duration", "") if isinstance(train_data, dict) else "",
        "distance": train_data.get("distance", "") if isinstance(train_data, dict) else "",
        "route_coordinates": train_data.get("route_coordinates", []) if isinstance(train_data, dict) else [],
        "steps": train_data.get("steps", []) if isinstance(train_data, dict) else [],
        "status": train_data.get("status", "success") if isinstance(train_data, dict) else "error",
        "message": train_data.get("message") if isinstance(train_data, dict) else None,
    }

    return {"car": car_response, "train": train_response}
