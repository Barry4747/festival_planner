from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Path, HTTPException, status
from pydantic import BaseModel
from supabase import Client
from app.db.database import get_supabase_client
from app.core.supabase import get_current_user

router = APIRouter()

class TripRequest(BaseModel):
    festival_id: str
    festival_name: str
    festival_data: Dict[str, Any]

import httpx
from app.core.config import settings

@router.get("/")
async def get_trips(
    user: Dict[str, Any] = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get all saved trips for the authenticated user."""
    user_id = user.get("id") or user.get("sub")
    token = user.get("access_token")
    if not user_id or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID or token not found")

    try:
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
        }
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/user_trips",
                headers=headers,
                params={"user_id": f"eq.{user_id}", "order": "created_at.desc"}
            )
            res.raise_for_status()
            return res.json()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch trips: {str(e)}")

@router.post("/")
async def save_trip(
    trip: TripRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Save a festival to the user's trips."""
    user_id = user.get("id") or user.get("sub")
    token = user.get("access_token")
    if not user_id or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID or token not found")

    payload = {
        "user_id": user_id,
        "festival_id": trip.festival_id,
        "festival_name": trip.festival_name,
        "festival_data": trip.festival_data,
    }

    try:
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
            "Prefer": "resolution=merge-duplicates"
        }
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/user_trips",
                headers=headers,
                json=payload,
                params={"on_conflict": "user_id,festival_id"}
            )
            res.raise_for_status()
            
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to save trip: {str(e)}")

@router.delete("/{festival_id}")
async def delete_trip(
    festival_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Remove a festival from the user's trips."""
    user_id = user.get("id") or user.get("sub")
    token = user.get("access_token")
    if not user_id or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID or token not found")

    try:
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
        }
        async with httpx.AsyncClient() as client:
            res = await client.delete(
                f"{settings.SUPABASE_URL}/rest/v1/user_trips",
                headers=headers,
                params={"user_id": f"eq.{user_id}", "festival_id": f"eq.{festival_id}"}
            )
            res.raise_for_status()
            
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete trip: {str(e)}")
