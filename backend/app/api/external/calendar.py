import logging
from typing import Optional, Any, Dict
import httpx

logger = logging.getLogger("festival_planner.external.calendar")


class GoogleCalendarClient:
    """
    Klient do integracji z Google Calendar API w celu eksportowania planu wyjazdu (itinerary).
    Dokumentacja: https://developers.google.com/calendar/api/v3/reference
    """
    BASE_URL = "https://www.googleapis.com/calendar/v3"

    @classmethod
    async def create_trip_event(
        cls,
        user_access_token: str,
        summary: str,
        start_time_iso: str,
        end_time_iso: str,
        description: Optional[str] = None,
        location: Optional[str] = None,
        calendar_id: str = "primary"
    ) -> Dict[str, Any]:
        """
        Tworzy wydarzenie w kalendarzu zalogowanego użytkownika na podstawie tokenu OAuth z Supabase/Google.
        """
        url = f"{cls.BASE_URL}/calendars/{calendar_id}/events"
        headers = {
            "Authorization": f"Bearer {user_access_token}",
            "Content-Type": "application/json"
        }
        payload: Dict[str, Any] = {
            "summary": summary,
            "start": {"dateTime": start_time_iso},
            "end": {"dateTime": end_time_iso}
        }
        if description:
            payload["description"] = description
        if location:
            payload["location"] = location

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
