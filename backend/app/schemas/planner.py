"""Planner Pydantic schemas."""
from typing import List, Optional
from pydantic import BaseModel, Field


class TripDetailsModel(BaseModel):
    """Festival trip details for itinerary generation."""

    festival_name: str
    start_date: str
    end_date: str
    location: str


class UserPreferencesModel(BaseModel):
    """User preferences for itinerary generation."""

    budget: float
    travel_from: str
    music_genres: List[str] = Field(default_factory=list)


class SuggestFestivalRequest(BaseModel):
    """Payload for submitting a user-suggested festival."""

    suggested_name: str = Field(..., min_length=1, max_length=255)
    suggested_city: str = Field(..., min_length=1, max_length=255)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
