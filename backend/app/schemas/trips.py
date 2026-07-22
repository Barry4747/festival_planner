"""Saved trips Pydantic schemas."""
from typing import Any, Dict
from pydantic import BaseModel, Field


class TripRequest(BaseModel):
    """Payload for saving or updating a user trip."""

    festival_id: str = Field(..., min_length=1)
    festival_name: str = Field(..., min_length=1, max_length=255)
    festival_data: Dict[str, Any]
