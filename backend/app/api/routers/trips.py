"""Router for user saved trips.

All database operations go through the official supabase-py SDK — NOT raw httpx
calls to the REST API. This ensures correct connection management, error handling,
and avoids duplicating authentication headers by hand.
"""
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel, Field
from supabase import Client

from app.core.supabase import get_current_user
from app.db.database import get_supabase_client
from app.schemas.trips import TripRequest

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_user_id(user: Dict[str, Any]) -> str:
    """Extract user ID from the verified token payload, raising 401 if missing."""
    user_id = user.get("id") or user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user session.",
        )
    return str(user_id)


@router.get("/", response_model=List[Dict[str, Any]])
async def get_trips(
    user: Dict[str, Any] = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> List[Dict[str, Any]]:
    """Return all saved trips for the authenticated user, ordered newest first."""
    user_id = _get_user_id(user)
    try:
        result = (
            supabase.table("user_trips")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error("Failed to fetch trips for user %s: %s", user_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trips. Please try again.",
        )


@router.post("/", response_model=Dict[str, str])
async def save_trip(
    trip: TripRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> Dict[str, str]:
    """Save (or upsert) a festival to the user's trips."""
    user_id = _get_user_id(user)
    payload = {
        "user_id": user_id,
        "festival_id": trip.festival_id,
        "festival_name": trip.festival_name,
        "festival_data": trip.festival_data,
    }
    try:
        (
            supabase.table("user_trips")
            .upsert(payload, on_conflict="user_id,festival_id")
            .execute()
        )
        return {"status": "success"}
    except Exception as e:
        logger.error("Failed to save trip for user %s: %s", user_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save trip. Please try again.",
        )


@router.delete("/{festival_id}", response_model=Dict[str, str])
async def delete_trip(
    festival_id: str = Path(..., min_length=1),
    user: Dict[str, Any] = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> Dict[str, str]:
    """Remove a festival from the user's saved trips."""
    user_id = _get_user_id(user)
    try:
        (
            supabase.table("user_trips")
            .delete()
            .eq("user_id", user_id)
            .eq("festival_id", festival_id)
            .execute()
        )
        return {"status": "success"}
    except Exception as e:
        logger.error(
            "Failed to delete trip %s for user %s: %s",
            festival_id, user_id, e, exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete trip. Please try again.",
        )
