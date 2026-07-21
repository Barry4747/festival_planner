"""LangGraph node and tool definitions for the Festival Planner AI concierge.

Architecture boundary rule:
  - This module is ONLY responsible for natural language reasoning.
  - All deterministic data operations (geocoding, routing, festival discovery,
    weather fetching) are delegated to service-layer functions.
  - The LLM never computes distances, prices, or dates directly.

Logging: structured logger only — no print() statements in production code.
"""
import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

from app.agents.state import PlannerState
from app.api.external import TicketmasterClient
from app.core.geo_constants import get_coords
from app.core.llm import get_llm
from app.services.aggregator import FestivalAggregator
from app.services.festival_sources import SupabaseSource, TicketmasterSource
from app.services.transport import geocode_city, get_car_route, get_google_directions
from app.services.weather import fetch_weather

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level singletons — avoid re-instantiation on every tool call
# ---------------------------------------------------------------------------

_aggregator = FestivalAggregator([TicketmasterSource(), SupabaseSource()])


# ---------------------------------------------------------------------------
# LangGraph Tools
# ---------------------------------------------------------------------------


@tool
async def search_artist_events(artist_name: str) -> dict:
    """Search for upcoming events and concerts for a specific artist or band
    using the Ticketmaster Discovery API.

    Args:
        artist_name: The exact name of the music artist or band (e.g., 'Arctic Monkeys').

    Returns:
        A dictionary containing matching events, venue, date, location, and ticket info.
    """
    logger.info("Tool: search_artist_events | artist=%s", artist_name)
    response = await TicketmasterClient.search_events(keyword=artist_name, size=5)
    logger.debug("Tool: search_artist_events | result_keys=%s", list(response.keys()))
    return response


@tool
async def discover_festivals(
    location_type: str,
    location_value: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    genres: Optional[List[str]] = None,
) -> dict:
    """Search and discover music festivals via FestivalAggregator
    (Ticketmaster API + local SQLite DB).

    Args:
        location_type: Granularity: 'city', 'country', or 'europe'.
        location_value: Corresponding value (e.g., 'Warszawa', 'PL', 'Europe').
        date_from: Optional start date filter (YYYY-MM-DD).
        date_to: Optional end date filter (YYYY-MM-DD).
        genres: Optional list of genres to filter by (e.g., ['Rock', 'Electronic']).

    Returns:
        A dictionary with discovered festivals including coordinates for mapping.
    """
    loc_type = (location_type or "").strip().lower()
    loc_val = (location_value or "").strip()
    lat, lng, radius_km = get_coords(loc_type, loc_val)

    logger.info(
        "Tool: discover_festivals | type=%s val=%s coords=(%s, %s) radius=%skm dates=%s..%s",
        loc_type, loc_val, lat, lng, radius_km, date_from, date_to,
    )

    festivals = await _aggregator.aggregate_festivals(
        lat=lat, lng=lng, radius_km=radius_km,
        start_date=date_from, end_date=date_to,
    )

    result = {
        "count": len(festivals),
        "location_queried": {
            "type": loc_type, "value": loc_val,
            "lat": lat, "lng": lng, "radius_km": radius_km,
        },
        "festivals": festivals,
    }
    logger.info("Tool: discover_festivals | returned %d festivals", len(festivals))
    return result


@tool
async def get_travel_options(
    origin_city: str,
    destination_city: str,
    destination_lat: float,
    destination_lng: float,
    date: str,
) -> str:
    """Calculate and compare car and train travel options between two cities.

    Args:
        origin_city: Clean city name of departure (e.g., 'Gorzów Śląski').
          IMPORTANT: Pass ONLY the city name — never include event names,
          dates, ticket types, or pipe characters.
        destination_city: Clean city name of the festival destination.
        destination_lat: Latitude of the festival destination.
        destination_lng: Longitude of the festival destination.
        date: Travel date in YYYY-MM-DD format.

    Returns:
        JSON string with car estimates (time, distance, fuel cost) and
        top train connections.
    """
    logger.info(
        "Tool: get_travel_options | %s -> %s (%s, %s) on %s",
        origin_city, destination_city, destination_lat, destination_lng, date,
    )

    orig_lat, orig_lng = await geocode_city(origin_city)

    car_data, train_data = await asyncio.gather(
        get_car_route(orig_lat, orig_lng, destination_lat, destination_lng),
        get_google_directions(origin_city, destination_city, "transit"),
    )

    result = {
        "query": {
            "origin_city": origin_city,
            "origin_coords": {"lat": orig_lat, "lng": orig_lng},
            "destination_city": destination_city,
            "destination_coords": {"lat": destination_lat, "lng": destination_lng},
            "date": date,
        },
        "car_option": car_data,
        "train_options": train_data,
    }

    logger.info("Tool: get_travel_options | completed successfully")
    return json.dumps(result, ensure_ascii=False, indent=2)


@tool
async def fetch_weather_forecast(city: str, date: str) -> dict:
    """Fetch the 5-day weather forecast for a specific city.

    ONLY call this tool if the festival/event date is within the next 5 days.
    For events further in the future, rely on internal knowledge of seasonal
    climate averages for that location and month instead.

    Args:
        city: City name to get the forecast for (e.g., 'Berlin', 'Warsaw').
        date: Event date in YYYY-MM-DD format.
    """
    logger.info("Tool: fetch_weather_forecast | city=%s date=%s", city, date)
    response = await fetch_weather(city, date)
    logger.info("Tool: fetch_weather_forecast | completed")
    return response


# ---------------------------------------------------------------------------
# LangGraph Node
# ---------------------------------------------------------------------------


async def lineup_node(state: PlannerState) -> dict:
    """LangGraph node — AI Concierge that reads context and answers questions
    or invokes tools for discovery, routing, and weather."""
    llm = get_llm(temperature=0.2)
    llm_with_tools = llm.bind_tools(
        [search_artist_events, discover_festivals, get_travel_options, fetch_weather_forecast]
    )

    context = state.get("context") or {}
    festival_name = context.get("name") or context.get("festival_name") or "the selected festival"
    location = (
        context.get("location")
        or (f"{context.get('lat')}, {context.get('lng')}" if context.get("lat") else "selected region")
    )
    start_date = context.get("date") or context.get("start_date") or "upcoming dates"
    end_date = context.get("end_date") or ""
    festival_url = context.get("url") or ""
    budget = context.get("budget", "Flexible")
    travel_from = context.get("travel_from", "Flexible location")
    music_genres = context.get("music_genres", [])
    genres_str = ", ".join(music_genres) if isinstance(music_genres, list) else str(music_genres)

    date_range = f"{start_date} to {end_date}" if end_date else start_date
    url_line = f"Official Link: {festival_url}" if festival_url else ""

    system_prompt = f"""You are an AI Festival Concierge & Travel Guide.
Today is {datetime.now().strftime('%B %d, %Y')}.

Your primary goals:
1. Act as a knowledgeable concierge for {festival_name}
   (Location: {location}, Dates: {date_range}). {url_line}

2. Logistics & Transport: When a user asks about travel, invoke `get_travel_options`
   with origin_city="{travel_from}", destination_city="{location}",
   destination_lat={context.get('lat', 52.2297)}, destination_lng={context.get('lng', 21.0122)},
   date="{start_date}". When summarising routes, always include the specific station
   names from the tool response (e.g., "Warszawa Zachodnia"), not just the city.

3. Event Discovery: Use `discover_festivals` when the user asks for events in a
   specific timeframe or area. Pass location_type ('city'/'country'/'europe'),
   location_value, and optional date_from/date_to filters.

4. Artist Lookup: Use `search_artist_events` ONLY with a specific artist/band name.
   Never pass a festival name as an artist name.

5. Weather: Use `fetch_weather_forecast` only if the event date is within 5 days.
   For future events, describe seasonal climate from your knowledge instead.

User preferences:
- Favourite genres: {genres_str}
- Budget: {budget} PLN
- Travelling from: {travel_from}

Always provide a detailed, engaging, structured markdown response."""

    user_messages = list(state.get("messages", []))
    is_initial_turn = len(user_messages) == 0

    if is_initial_turn:
        user_messages = [
            HumanMessage(
                content=(
                    f"Please provide concierge advice, lineup highlights, and travel tips "
                    f"for {festival_name} (Location: {location}, Dates: {date_range}).\n"
                    f"User preferences -> Genres: {genres_str}, Budget: {budget} PLN, "
                    f"Travelling from: {travel_from}.\n"
                    f"Use available tools to discover events, check tour dates, or plan transport."
                )
            )
        ]

    messages = [SystemMessage(content=system_prompt)] + user_messages
    llm_response = await llm_with_tools.ainvoke(messages)

    if hasattr(llm_response, "tool_calls") and llm_response.tool_calls:
        logger.info("lineup_node: AI requested tools: %s", [tc["name"] for tc in llm_response.tool_calls])

    # Extract weather forecast from tool messages if present in the state history
    weather_forecast = state.get("weather_forecast")
    for msg in reversed(user_messages):
        if getattr(msg, "type", "") == "tool" and getattr(msg, "name", "") == "fetch_weather_forecast":
            try:
                weather_forecast = json.loads(msg.content)
            except Exception:
                pass
            break

    return {"messages": [llm_response], "weather_forecast": weather_forecast}
