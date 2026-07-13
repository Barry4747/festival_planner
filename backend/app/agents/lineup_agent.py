import json
import logging
from typing import Any, Dict
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from app.agents.state import PlannerState
from app.api.external import TicketmasterClient
from app.core.llm import get_llm

logger = logging.getLogger("festival_planner.agents.lineup")


@tool
async def search_artist_events(artist_name: str) -> dict:
    """Search for upcoming events and concerts for a specific artist or band using the Ticketmaster Discovery API.

    Args:
        artist_name: The exact name of the music artist or band to search events for (e.g., 'Arctic Monkeys').

    Returns:
        A dictionary containing matching events, venue, date, location, and ticket information from Ticketmaster.
    """
    print(f"\n=======================================================")
    print(f"🛠️ [TOOL CALL EXECUTING] Tool: search_artist_events | Input: '{artist_name}'")
    logger.info(f"🛠️ [TOOL CALL EXECUTING] Tool: search_artist_events | Input: '{artist_name}'")

    response = await TicketmasterClient.search_events(keyword=artist_name, size=5)

    # Przygotowanie czytelnego zrzutu JSON response w logach
    try:
        response_formatted = json.dumps(response, indent=2, ensure_ascii=False)
        display_output = response_formatted if len(response_formatted) < 3000 else response_formatted[:3000] + "\n... [TRUNCATED FOR LOGS]"
    except Exception:
        display_output = str(response)

    print(f"📥 [TOOL RESPONSE] Ticketmaster API Response for '{artist_name}':\n{display_output}")
    print(f"=======================================================\n")
    logger.info(f"📥 [TOOL RESPONSE] Ticketmaster API Response for '{artist_name}' received.")

    return response


async def lineup_node(state: PlannerState) -> dict:
    """LangGraph node for analyzing festival lineups and finding artist events."""
    llm = get_llm(temperature=0.2)
    llm_with_tools = llm.bind_tools([search_artist_events])

    trip_details = state["trip_details"]
    user_prefs = state["user_preferences"]

    festival_name = (
        trip_details.festival_name
        if hasattr(trip_details, "festival_name")
        else trip_details["festival_name"]
    )
    location = (
        trip_details.location
        if hasattr(trip_details, "location")
        else trip_details.get("location", "")
    )
    start_date = (
        trip_details.start_date
        if hasattr(trip_details, "start_date")
        else trip_details.get("start_date", "")
    )
    end_date = (
        trip_details.end_date
        if hasattr(trip_details, "end_date")
        else trip_details.get("end_date", "")
    )

    music_genres = (
        user_prefs.music_genres
        if hasattr(user_prefs, "music_genres")
        else user_prefs.get("music_genres", [])
    )
    budget = (
        user_prefs.budget
        if hasattr(user_prefs, "budget")
        else user_prefs.get("budget", "")
    )
    travel_from = (
        user_prefs.travel_from
        if hasattr(user_prefs, "travel_from")
        else user_prefs.get("travel_from", "")
    )

    genres_str = (
        ", ".join(music_genres) if isinstance(music_genres, list) else str(music_genres)
    )
    system_prompt = f"""You are a Festival Lineup Expert. 
    Your goal is to plan a trip to {festival_name}.
    CRITICAL RULE: The tool `search_artist_events` MUST ONLY be used with specific artist/band names (e.g., 'Arctic Monkeys'). 
    NEVER pass the festival name as the artist name to the tool.
    If you don't know any artists yet, suggest a few based on the user's favorite genres: {genres_str} and check their availability."""

    user_messages = list(state.get("messages", []))
    is_initial_turn = len(user_messages) == 0

    if is_initial_turn:
        initial_human_msg = HumanMessage(
            content=(
                f"Please analyze the lineup and upcoming events for {festival_name} "
                f"(Location: {location}, Dates: {start_date} to {end_date}).\n"
                f"User preferences -> Music genres: {genres_str}, Budget: {budget} PLN, Traveling from: {travel_from}.\n"
                f"Use the `search_artist_events` tool to check for concerts of top artists matching these genres or associated with {festival_name}, "
                f"and provide a detailed, engaging summary and recommendations."
            )
        )
        user_messages = [initial_human_msg]

    messages = [SystemMessage(content=system_prompt)] + user_messages
    llm_response = await llm_with_tools.ainvoke(messages)

    if hasattr(llm_response, "tool_calls") and llm_response.tool_calls:
        print(f"\n🤖 [GEMINI TOOL REQUEST] Model requested tool calls: {json.dumps(llm_response.tool_calls, indent=2, ensure_ascii=False)}")
        logger.info(f"🤖 [GEMINI TOOL REQUEST] Model requested tool calls: {llm_response.tool_calls}")
    else:
        print(f"\n✨ [GEMINI FINAL RESPONSE] Model generated final summary ({len(str(llm_response.content))} chars).")
        logger.info(f"✨ [GEMINI FINAL RESPONSE] Model generated final summary.")

    if is_initial_turn:
        return {"messages": [user_messages[0], llm_response]}
    return {"messages": [llm_response]}

