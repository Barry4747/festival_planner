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

    def __init__(self, client: Client, service_client: Optional[Client] = None):
        self.client = client
        self.service_client = service_client

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

    def _sync_get_thread_by_user_and_festival(
        self, user_id: str, festival_id: str
    ) -> Optional[Dict[str, Any]]:
        response = (
            self.client.table("threads")
            .select("*")
            .eq("user_id", user_id)
            .eq("festival_id", str(festival_id))
            .execute()
        )
        rows = (
            response.data
            if response and hasattr(response, "data") and isinstance(response.data, list)
            else []
        )
        return rows[0] if rows else None

    async def get_thread_by_user_and_festival(
        self, user_id: str, festival_id: str
    ) -> Optional[Dict[str, Any]]:
        return await asyncio.to_thread(
            self._sync_get_thread_by_user_and_festival, user_id, festival_id
        )

    def _sync_create_thread(self, user_id: str, festival_id: str) -> Dict[str, Any]:
        payload = {"user_id": user_id, "festival_id": str(festival_id)}
        response = self.client.table("threads").insert(payload).execute()
        rows = (
            response.data
            if response and hasattr(response, "data") and isinstance(response.data, list) and len(response.data) > 0
            else []
        )
        if rows:
            return rows[0]
        existing = self._sync_get_thread_by_user_and_festival(user_id, festival_id)
        return existing or {"user_id": user_id, "festival_id": str(festival_id)}

    async def create_thread(self, user_id: str, festival_id: str) -> Dict[str, Any]:
        return await asyncio.to_thread(self._sync_create_thread, user_id, festival_id)

    async def get_or_create_thread(self, user_id: str, festival_id: str) -> Dict[str, Any]:
        thread = await self.get_thread_by_user_and_festival(user_id, festival_id)
        if not thread:
            thread = await self.create_thread(user_id, festival_id)
        return thread

    def _sync_get_chat_messages_by_thread_id(self, thread_id: str) -> List[Dict[str, Any]]:
        response = (
            self.client.table("chat_messages")
            .select("*")
            .eq("thread_id", str(thread_id))
            .order("created_at", desc=False)
            .execute()
        )
        rows = (
            response.data
            if response and hasattr(response, "data") and isinstance(response.data, list)
            else []
        )
        return rows

    async def get_chat_messages_by_thread_id(self, thread_id: str) -> List[Dict[str, Any]]:
        return await asyncio.to_thread(self._sync_get_chat_messages_by_thread_id, thread_id)

    def _sync_insert_chat_message(
        self, thread_id: str, role: str, content: str
    ) -> Dict[str, Any]:
        payload = {"thread_id": str(thread_id), "role": role, "content": content}
        
        # Use service_role client to bypass RLS when inserting assistant messages
        client_to_use = self.service_client if role == "assistant" and self.service_client else self.client
        
        response = client_to_use.table("chat_messages").insert(payload).execute()
        rows = (
            response.data
            if response and hasattr(response, "data") and isinstance(response.data, list) and len(response.data) > 0
            else [{}]
        )
        return rows[0]

    async def insert_chat_message(
        self, thread_id: str, role: str, content: str
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(self._sync_insert_chat_message, thread_id, role, content)
