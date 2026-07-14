import asyncio
import logging
from typing import List, Dict, Any, Optional
from supabase import Client

logger = logging.getLogger(__name__)


class FestivalRepository:
    """
    Repository layer responsible for all Supabase database interactions
    concerning festivals (`local_festivals`) and user suggestions (`festival_suggestions`).
    """

    def __init__(self, client: Client):
        self.client = client

    def _sync_save_suggestion(
        self,
        name: str,
        city: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        payload = {
            "suggested_name": name.strip(),
            "suggested_city": city.strip(),
            "status": "pending",
        }
        if start_date:
            payload["start_date"] = start_date.strip()
        if end_date:
            payload["end_date"] = end_date.strip()
        if user_id:
            payload["user_id"] = user_id

        response = self.client.table("festival_suggestions").insert(payload).execute()
        rows = (
            response.data
            if response and hasattr(response, "data") and isinstance(response.data, list) and len(response.data) > 0
            else [{}]
        )
        return rows[0]

    async def save_suggestion(
        self,
        name: str,
        city: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Asynchronously save a user festival suggestion to the database."""
        return await asyncio.to_thread(
            self._sync_save_suggestion, name, city, start_date, end_date, user_id
        )

    def _sync_get_local_festivals_in_bounding_box(
        self,
        min_lat: float,
        max_lat: float,
        min_lng: float,
        max_lng: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query = self.client.table("local_festivals").select("*")
        query = query.gte("lat", min_lat).lte("lat", max_lat)
        query = query.gte("lng", min_lng).lte("lng", max_lng)

        if start_date:
            query = query.gte("end_date", start_date)
        if end_date:
            query = query.lte("start_date", end_date)

        response = query.execute()
        rows = (
            response.data
            if response and hasattr(response, "data") and isinstance(response.data, list)
            else []
        )
        return rows

    async def get_local_festivals_in_bounding_box(
        self,
        min_lat: float,
        max_lat: float,
        min_lng: float,
        max_lng: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Asynchronously query local_festivals within latitude and longitude bounds."""
        return await asyncio.to_thread(
            self._sync_get_local_festivals_in_bounding_box,
            min_lat,
            max_lat,
            min_lng,
            max_lng,
            start_date,
            end_date,
        )
