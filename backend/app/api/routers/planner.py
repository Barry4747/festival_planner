"""Planner router — festival discovery, weather, and legacy plan-trip endpoints."""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.core.rate_limit import check_rate_limit
from app.core.supabase import get_current_user
from app.dependencies import (
    get_concierge_service,
    get_discovery_service,
    get_suggestion_service,
)
from app.schemas.chat import BaseChatRequest  # noqa: F401 — re-exported for legacy use
from app.services import (
    FestivalConciergeService,
    FestivalDiscoveryService,
    FestivalSuggestionService,
)
from app.services.weather import fetch_weather
from langgraph.errors import GraphRecursionError
from fastapi import HTTPException

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic models local to the planner
# ---------------------------------------------------------------------------


class TripDetailsModel(BaseModel):
    festival_name: str
    start_date: str
    end_date: str
    location: str


class UserPreferencesModel(BaseModel):
    budget: float
    travel_from: str
    music_genres: List[str] = Field(default_factory=list)


class SuggestFestivalRequest(BaseModel):
    suggested_name: str = Field(..., min_length=1, max_length=255)
    suggested_city: str = Field(..., min_length=1, max_length=255)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    # NOTE: user_id is intentionally NOT accepted from the request body.
    # It is extracted from the verified JWT token in the handler below.


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/weather")
async def get_weather(
    city: str,
    date: Optional[str] = None,
    _rate_limit: dict = Depends(check_rate_limit("weather")),
):
    """Fetch weather forecast for a city."""
    return await fetch_weather(city=city, date=date)


@router.get("/weather/current")
async def get_current_weather(
    lat: float,
    lon: float,
    _rate_limit: dict = Depends(check_rate_limit("weather")),
):
    """Fetch current weather conditions by coordinates."""
    from app.services.weather import fetch_current_weather

    return await fetch_current_weather(lat=lat, lon=lon)


@router.post("/festivals/suggest")
async def suggest_festival(
    request: SuggestFestivalRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    service: FestivalSuggestionService = Depends(get_suggestion_service),
):
    """Save a user-suggested festival.

    Requires authentication — user_id is extracted from the JWT token, NOT the
    request body, to prevent spoofing.
    """
    user_id = user.get("id") or user.get("sub")
    return await service.submit_suggestion(
        name=request.suggested_name,
        city=request.suggested_city,
        start_date=request.start_date,
        end_date=request.end_date,
        user_id=str(user_id) if user_id else None,
    )


@router.get("/festivals/map")
async def get_festivals_map(
    lat: float = Query(..., description="Latitude of the search center"),
    lng: float = Query(..., description="Longitude of the search center"),
    radius_km: int = Query(50, ge=1, le=2000, description="Search radius in km"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    service: FestivalDiscoveryService = Depends(get_discovery_service),
    _rate_limit: dict = Depends(check_rate_limit("ticketmaster")),
) -> List[Dict[str, Any]]:
    """Discover festivals for a map area via the aggregator (Ticketmaster + local DB)."""
    return await service.discover_festivals_map(
        lat=lat, lng=lng, radius_km=float(radius_km),
        start_date=start_date, end_date=end_date,
    )


@router.post("/plan-trip")
async def plan_trip(
    trip_details: TripDetailsModel,
    user_preferences: UserPreferencesModel,
    service: FestivalConciergeService = Depends(get_concierge_service),
    _rate_limit: dict = Depends(check_rate_limit("ai_agent")),
):
    """Legacy plan-trip endpoint kept for backwards compatibility."""
    try:
        return await service.generate_trip_itinerary(
            trip_details=trip_details.model_dump(),
            user_preferences=user_preferences.model_dump(),
        )
    except GraphRecursionError:
        raise HTTPException(
            status_code=422,
            detail="Przekroczono limit prób wywołania narzędzi przez Agenta AI. Spróbuj sformułować zapytanie inaczej."
        )
