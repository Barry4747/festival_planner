from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel, Field
from app.dependencies import (
    get_suggestion_service,
    get_discovery_service,
    get_concierge_service,
)
from app.services import (
    FestivalSuggestionService,
    FestivalDiscoveryService,
    FestivalConciergeService,
)
from app.services.weather import fetch_weather

router = APIRouter()

from app.core.rate_limit import check_rate_limit

@router.get("/weather")
async def get_weather(
    city: str, 
    date: Optional[str] = None,
    _rate_limit: dict = Depends(check_rate_limit("weather"))
):
    """Directly fetch weather forecast for a city."""
    return await fetch_weather(city=city, date=date)

@router.get("/weather/current")
async def get_current_weather(
    lat: float, 
    lon: float,
    _rate_limit: dict = Depends(check_rate_limit("weather"))
):
    """Fetch current weather by coordinates."""
    from app.services.weather import fetch_current_weather
    return await fetch_current_weather(lat=lat, lon=lon)


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, Any]]] = None


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
    suggested_name: str
    suggested_city: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    user_id: Optional[str] = None


@router.post("/festivals/suggest")
async def suggest_festival(
    request: SuggestFestivalRequest,
    service: FestivalSuggestionService = Depends(get_suggestion_service),
):
    """Save user suggested festival into Supabase database via clean architecture service."""
    return await service.submit_suggestion(
        name=request.suggested_name,
        city=request.suggested_city,
        start_date=request.start_date,
        end_date=request.end_date,
        user_id=request.user_id,
    )


@router.get("/festivals/map")
async def get_festivals_map(
    lat: float = Query(..., description="Latitude of the search center"),
    lng: float = Query(..., description="Longitude of the search center"),
    radius_km: int = Query(50, description="Search radius in kilometers"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    service: FestivalDiscoveryService = Depends(get_discovery_service),
    _rate_limit: dict = Depends(check_rate_limit("ticketmaster"))
) -> List[Dict[str, Any]]:
    """
    Direct map discovery endpoint. Delegates to FestivalDiscoveryService (Aggregator Pattern)
    and returns a unified, deduplicated list of music festivals with exact coordinates.
    """
    return await service.discover_festivals_map(
        lat=lat, lng=lng, radius_km=float(radius_km), start_date=start_date, end_date=end_date
    )


@router.post("/plan-trip")
async def plan_trip(
    trip_details: TripDetailsModel,
    user_preferences: UserPreferencesModel,
    service: FestivalConciergeService = Depends(get_concierge_service),
    _rate_limit: dict = Depends(check_rate_limit("ai_agent"))
):
    """
    Legacy plan-trip endpoint kept for backwards compatibility with existing frontend form.
    Delegates to FestivalConciergeService.
    """
    return await service.generate_trip_itinerary(
        trip_details=trip_details.model_dump(),
        user_preferences=user_preferences.model_dump(),
    )
