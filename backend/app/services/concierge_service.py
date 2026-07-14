import logging
from typing import Dict, Any, Optional, List
from langchain_core.messages import HumanMessage, AIMessage
from app.agents.graph import planner_app

logger = logging.getLogger(__name__)


class FestivalConciergeService:
    """Service encapsulating AI LangGraph chatbot interactions and trip itinerary generation."""

    async def generate_chat_response(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        messages_list = []
        if history:
            for m in history:
                role = m.get("role") or m.get("type", "user")
                content = m.get("content", "")
                if role in ("user", "human"):
                    messages_list.append(HumanMessage(content=content))
                elif role in ("assistant", "ai"):
                    messages_list.append(AIMessage(content=content))

        messages_list.append(HumanMessage(content=message))

        initial_state = {
            "messages": messages_list,
            "context": context or {}
        }
        result = await planner_app.ainvoke(initial_state)
        messages = result.get("messages", [])
        ai_msg = None
        for m in reversed(messages):
            if getattr(m, "type", "") == "ai" or type(m).__name__ == "AIMessage":
                ai_msg = m
                break
        if not ai_msg and messages:
            ai_msg = messages[-1]

        ai_content = getattr(ai_msg, "content", "") if ai_msg else "I couldn't generate a response."
        return {
            "reply": ai_content,
            "content": ai_content,
            "context": context
        }

    async def generate_trip_itinerary(
        self,
        trip_details: Dict[str, Any],
        user_preferences: Dict[str, Any],
    ) -> Dict[str, Any]:
        context = {
            "name": trip_details.get("festival_name", ""),
            "location": trip_details.get("location", ""),
            "start_date": trip_details.get("start_date", ""),
            "end_date": trip_details.get("end_date", ""),
            "budget": user_preferences.get("budget", 0),
            "travel_from": user_preferences.get("travel_from", ""),
            "music_genres": user_preferences.get("music_genres", []),
        }
        initial_human_msg = HumanMessage(
            content=(
                f"Please provide concierge advice, lineup highlights, and travel tips for {context['name']} "
                f"(Location: {context['location']}, Dates: {context['start_date']} to {context['end_date']}).\n"
                f"User preferences -> Music genres: {', '.join(context['music_genres'])}, Budget: {context['budget']} PLN, Traveling from: {context['travel_from']}.\n"
                f"Use `discover_festivals` or `search_artist_events` tools as needed to discover events or check tour dates."
            )
        )
        initial_state = {
            "messages": [initial_human_msg],
            "context": context
        }
        result = await planner_app.ainvoke(initial_state)
        messages = result.get("messages", [])
        ai_msg = None
        for m in reversed(messages):
            if getattr(m, "type", "") == "ai" or type(m).__name__ == "AIMessage":
                ai_msg = m
                break
        if not ai_msg and messages:
            ai_msg = messages[-1]

        ai_content = getattr(ai_msg, "content", "") if ai_msg else "No itinerary generated."

        raw_festivals = result.get("discovered_festivals", [])
        formatted_festivals = []
        for ev in raw_festivals:
            if isinstance(ev, dict):
                venues = ev.get("_embedded", {}).get("venues", [])
                lat = None
                lng = None
                if venues and isinstance(venues, list) and len(venues) > 0:
                    loc = venues[0].get("location", {})
                    if loc:
                        try:
                            lat = float(loc.get("latitude"))
                            lng = float(loc.get("longitude"))
                        except (TypeError, ValueError):
                            pass
                if lat is not None and lng is not None:
                    formatted_festivals.append({
                        "id": ev.get("id"),
                        "name": ev.get("name") or "Music Event",
                        "lat": lat,
                        "lng": lng,
                        "date": ev.get("dates", {}).get("start", {}).get("localDate") or "",
                        "url": ev.get("url") or "",
                        "raw": ev
                    })

        return {
            "content": ai_content,
            "discovered_festivals": formatted_festivals,
            "raw_festivals": raw_festivals
        }
