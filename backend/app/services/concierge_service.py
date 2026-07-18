import logging
from typing import Dict, Any, Optional, List
from langchain_core.messages import HumanMessage, AIMessage
from app.repositories import FestivalRepository

logger = logging.getLogger(__name__)


class FestivalConciergeService:
    """Service encapsulating AI LangGraph chatbot interactions and trip itinerary generation."""

    def __init__(self, repository: Optional[FestivalRepository] = None):
        self.repository = repository

    async def get_chat_history_for_festival(
        self, user_id: str, festival_id: str
    ) -> List[Dict[str, Any]]:
        """Fetch entity-bound historical chat messages ordered by created_at."""
        if not self.repository:
            return []
        try:
            thread = await self.repository.get_thread_by_user_and_festival(user_id, festival_id)
            if not thread:
                return []
            thread_id = thread.get("id")
            if not thread_id:
                return []
            return await self.repository.get_chat_messages_by_thread_id(str(thread_id))
        except Exception as e:
            logger.error(f"❌ [FestivalConciergeService] Error fetching history: {e}")
            return []

    async def generate_chat_response(
        self,
        message: str,
        festival_id: Optional[str] = None,
        festival_context: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict[str, Any]]] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        messages_list = []
        ctx = festival_context or context or {}
        thread_id = None

        # 1. Entity-bound history retrieval if user_id and festival_id are provided
        if user_id and festival_id and self.repository:
            try:
                thread = await self.repository.get_or_create_thread(user_id, festival_id)
                thread_id = thread.get("id")
                if thread_id:
                    existing_rows = await self.repository.get_chat_messages_by_thread_id(str(thread_id))
                    for row in existing_rows:
                        role = row.get("role")
                        content = row.get("content", "")
                        if role == "user":
                            messages_list.append(HumanMessage(content=content))
                        elif role == "assistant":
                            messages_list.append(AIMessage(content=content))
            except Exception as e:
                logger.error(f"⚠️ [FestivalConciergeService] Could not load entity-bound thread/messages: {e}")

        # If no entity-bound thread loaded, fallback to payload history
        if not messages_list and history:
            for m in history:
                role = m.get("role") or m.get("type", "user")
                content = m.get("content", "")
                if role in ("user", "human"):
                    messages_list.append(HumanMessage(content=content))
                elif role in ("assistant", "ai"):
                    messages_list.append(AIMessage(content=content))

        # Append new user prompt
        messages_list.append(HumanMessage(content=message))

        initial_state = {
            "messages": messages_list,
            "context": ctx
        }
        from app.agents.graph import planner_app
        result = await planner_app.ainvoke(initial_state)
        messages = result.get("messages", [])
        ai_msg = None
        for m in reversed(messages):
            if getattr(m, "type", "") == "ai" or type(m).__name__ == "AIMessage":
                ai_msg = m
                break
        if not ai_msg and messages:
            ai_msg = messages[-1]

        route_geometry = None
        for m in reversed(messages):
            m_type = getattr(m, "type", "") or type(m).__name__
            m_name = getattr(m, "name", "")
            if m_type in ("tool", "ToolMessage") or m_name == "get_travel_options":
                m_content = getattr(m, "content", "")
                if isinstance(m_content, str) and "car_option" in m_content and "geometry" in m_content:
                    try:
                        import json
                        tool_data = json.loads(m_content)
                        if isinstance(tool_data, dict) and "car_option" in tool_data:
                            geom = tool_data["car_option"].get("geometry")
                            if isinstance(geom, list) and len(geom) > 0:
                                route_geometry = geom
                                break
                    except Exception as e:
                        logger.debug(f"Could not parse tool message for route_geometry: {e}")

        ai_content = getattr(ai_msg, "content", "") if ai_msg else "I couldn't generate a response."
        if isinstance(ai_content, list):
            texts = []
            for item in ai_content:
                if isinstance(item, dict) and "text" in item:
                    texts.append(str(item["text"]))
                elif isinstance(item, str):
                    texts.append(item)
                else:
                    texts.append(str(item))
            ai_content = "\n".join(texts)
        elif not isinstance(ai_content, str):
            ai_content = str(ai_content)

        # 2. Persist new prompt & AI response in entity-bound thread if available
        if thread_id and self.repository:
            try:
                await self.repository.insert_chat_message(str(thread_id), "user", message)
                await self.repository.insert_chat_message(str(thread_id), "assistant", ai_content)
            except Exception as e:
                logger.error(f"⚠️ [FestivalConciergeService] Failed inserting messages to DB: {e}")

        return {
            "reply": ai_content,
            "content": ai_content,
            "context": ctx,
            "thread_id": thread_id,
            "route_geometry": route_geometry,
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
        from app.agents.graph import planner_app
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
        if isinstance(ai_content, list):
            texts = []
            for item in ai_content:
                if isinstance(item, dict) and "text" in item:
                    texts.append(str(item["text"]))
                elif isinstance(item, str):
                    texts.append(item)
                else:
                    texts.append(str(item))
            ai_content = "\n".join(texts)
        elif not isinstance(ai_content, str):
            ai_content = str(ai_content)

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
