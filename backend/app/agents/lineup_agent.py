import asyncio
import json
import logging
from typing import Any, Dict, Optional, List
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
    print(f"[TOOL CALL EXECUTING] Tool: search_artist_events | Input: '{artist_name}'")
    logger.info(f"🛠️ [TOOL CALL EXECUTING] Tool: search_artist_events | Input: '{artist_name}'")

    response = await TicketmasterClient.search_events(keyword=artist_name, size=5)

    # Przygotowanie czytelnego zrzutu JSON response w logach
    try:
        response_formatted = json.dumps(response, indent=2, ensure_ascii=False)
        display_output = response_formatted if len(response_formatted) < 3000 else response_formatted[:3000] + "\n... [TRUNCATED FOR LOGS]"
    except Exception:
        display_output = str(response)

    print(f"[TOOL RESPONSE] Ticketmaster API Response for '{artist_name}':\n{display_output}")
    print(f"=======================================================\n")
    logger.info(f"📥 [TOOL RESPONSE] Ticketmaster API Response for '{artist_name}' received.")

    return response


from app.services.aggregator import FestivalAggregator
from app.services.festival_sources import TicketmasterSource, SupabaseSource, LocalDbSource
from app.services.transport import get_car_route, get_train_routes, geocode_city


def _get_coords_for_location(location_type: str, location_value: str) -> tuple[float, float, float]:
    """Helper returning (lat, lng, radius_km) for location granularity."""
    val = (location_value or "").strip().lower()
    city_coords = {
        "warszawa": (52.2297, 21.0122, 100.0),
        "warsaw": (52.2297, 21.0122, 100.0),
        "krakow": (50.0647, 19.9450, 100.0),
        "kraków": (50.0647, 19.9450, 100.0),
        "gdynia": (54.5189, 18.5305, 120.0),
        "gdansk": (54.3520, 18.6466, 120.0),
        "gdańsk": (54.3520, 18.6466, 120.0),
        "katowice": (50.2649, 19.0238, 100.0),
        "poznan": (52.4064, 16.9252, 100.0),
        "poznań": (52.4064, 16.9252, 100.0),
        "wroclaw": (51.1079, 17.0385, 100.0),
        "wrocław": (51.1079, 17.0385, 100.0),
        "plock": (52.5463, 19.7065, 100.0),
        "płock": (52.5463, 19.7065, 100.0),
        "czaplinek": (53.5550, 16.2333, 100.0),
        "boom": (51.0880, 4.3667, 150.0),
        "berlin": (52.5200, 13.4050, 150.0),
        "paris": (48.8566, 2.3522, 150.0),
        "london": (51.5074, -0.1278, 150.0),
        "amsterdam": (52.3676, 4.9041, 150.0),
        "prague": (50.0755, 14.4378, 150.0),
        "vienna": (48.2082, 16.3738, 150.0),
        "budapest": (47.4979, 19.0402, 150.0),
        "barcelona": (41.3851, 2.1734, 150.0),
        "europe": (51.1657, 10.4515, 800.0),
        "pl": (51.9194, 19.1451, 400.0),
        "poland": (51.9194, 19.1451, 400.0),
        "de": (51.1657, 10.4515, 400.0),
        "germany": (51.1657, 10.4515, 400.0),
    }
    if val in city_coords:
        return city_coords[val]
    if (location_type or "").strip().lower() == "europe" or val == "europe":
        return (51.1657, 10.4515, 800.0)
    if (location_type or "").strip().lower() == "country":
        return (51.9194, 19.1451, 400.0)
    return (52.0647, 19.2450, 250.0)


@tool
async def discover_festivals(
    location_type: str,
    location_value: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    genres: Optional[List[str]] = None
) -> dict:
    """Search and discover music festivals and major events via FestivalAggregator (Ticketmaster API + Local SQLite DB).

    Args:
        location_type: Granularity of location search. Must be one of: 'city', 'country', 'europe'.
        location_value: The value corresponding to location_type (e.g., 'Warszawa' for city, 'PL' for country, 'Europe' for europe).
        date_from: Optional start date filter in YYYY-MM-DD format (e.g., '2026-07-01').
        date_to: Optional end date filter in YYYY-MM-DD format (e.g., '2026-08-31').
        genres: Optional list of music genres to filter festivals by (e.g., ['Rock', 'Electronic']).

    Returns:
        A dictionary containing discovered festivals, including dates, venue details, and precise geographic coordinates (`latitude`, `longitude`) for mapping.
    """
    loc_type = (location_type or "").strip().lower()
    loc_val = (location_value or "").strip()

    lat, lng, radius_km = _get_coords_for_location(loc_type, loc_val)

    print(f"\n=======================================================")
    print(f"[TOOL CALL EXECUTING] Tool: discover_festivals (Aggregator) | Type: {loc_type} | Val: {loc_val} | Coords: ({lat}, {lng}) radius={radius_km}km | Dates: {date_from}..{date_to}")
    logger.info(f"🛠️ [TOOL CALL EXECUTING] Tool: discover_festivals (Aggregator) | Type: {loc_type} | Val: {loc_val}")

    aggregator = FestivalAggregator([TicketmasterSource(), SupabaseSource()])
    festivals = await aggregator.aggregate_festivals(
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        start_date=date_from,
        end_date=date_to
    )

    result = {
        "count": len(festivals),
        "location_queried": {"type": loc_type, "value": loc_val, "lat": lat, "lng": lng, "radius_km": radius_km},
        "festivals": festivals
    }

    try:
        response_formatted = json.dumps(result, indent=2, ensure_ascii=False)
        display_output = response_formatted if len(response_formatted) < 3000 else response_formatted[:3000] + "\n... [TRUNCATED FOR LOGS]"
    except Exception:
        display_output = str(result)

    print(f"[TOOL RESPONSE] Aggregator Response for discover_festivals ({len(festivals)} items):\n{display_output}")
    print(f"=======================================================\n")
    logger.info(f"📥 [TOOL RESPONSE] Aggregator returned {len(festivals)} festivals.")

    return result


@tool
async def get_travel_options(
    origin_city: str,
    destination_city: str,
    destination_lat: float,
    destination_lng: float,
    date: str
) -> str:
    """Calculate and compare travel options (Car and Train) between an origin city and the festival destination.

    Args:
        origin_city: The starting city of the user (e.g., 'Warsaw').
        destination_city: The festival city or destination city (e.g., 'Berlin' or 'Gdynia').
        destination_lat: Latitude coordinate of the festival destination.
        destination_lng: Longitude coordinate of the festival destination.
        date: Departure or festival date in YYYY-MM-DD format (e.g., '2026-07-15').

    Returns:
        A combined JSON string containing detailed car driving estimates (time, distance, fuel cost) and top 3 train connections.
    """
    print(f"\n=======================================================")
    print(f"[TOOL CALL EXECUTING] Tool: get_travel_options | From: {origin_city} -> To: {destination_city} ({destination_lat}, {destination_lng}) on {date}")
    logger.info(f"🛠️ [TOOL CALL EXECUTING] Tool: get_travel_options | From: {origin_city} -> To: {destination_city}")

    orig_lat, orig_lng = await geocode_city(origin_city)

    car_route_task = get_car_route(orig_lat, orig_lng, destination_lat, destination_lng)
    train_routes_task = get_train_routes(origin_city, destination_city, date)

    car_data, train_data = await asyncio.gather(car_route_task, train_routes_task)

    combined_result = {
        "query": {
            "origin_city": origin_city,
            "origin_coords": {"lat": orig_lat, "lng": orig_lng},
            "destination_city": destination_city,
            "destination_coords": {"lat": destination_lat, "lng": destination_lng},
            "date": date
        },
        "car_option": car_data,
        "train_options": train_data
    }

    response_json = json.dumps(combined_result, ensure_ascii=False, indent=2)
    print(f"[TOOL RESPONSE] get_travel_options combined options:\n{response_json}")
    print(f"=======================================================\n")
    logger.info(f"📥 [TOOL RESPONSE] get_travel_options returned car and {len(train_data)} train options.")

    return response_json


async def lineup_node(state: PlannerState) -> dict:
    """LangGraph node acting as an AI Concierge reading context and answering questions or discovering events."""
    llm = get_llm(temperature=0.2)
    llm_with_tools = llm.bind_tools([search_artist_events, discover_festivals, get_travel_options])

    context = state.get("context") or {}
    festival_name = context.get("name") or context.get("festival_name") or "the selected music festival"
    location = context.get("location") or (f"{context.get('lat')}, {context.get('lng')}" if context.get("lat") else "selected region")
    start_date = context.get("date") or context.get("start_date") or "upcoming dates"
    end_date = context.get("end_date") or ""
    festival_url = context.get("url") or ""
    budget = context.get("budget", "Flexible")
    travel_from = context.get("travel_from", "Flexible location")
    music_genres = context.get("music_genres", [])
    genres_str = ", ".join(music_genres) if isinstance(music_genres, list) else str(music_genres)

    system_prompt = f"""You are an AI Festival Concierge & Travel Guide.
Your primary goals:
1. Act as a dedicated, knowledgeable concierge for {festival_name} (Location: {location}, Dates: {start_date}{f' to {end_date}' if end_date else ''}).
   {f'Official Link: {festival_url}' if festival_url else ''}
2. Logistics & Transport Planning: When a user asks "How do I get there?", "Plan my travel", "What are travel options?", or asks about logistics/transport from their location ({travel_from}), you MUST invoke the `get_travel_options` tool using `origin_city`="{travel_from}", `destination_city`="{location}", `destination_lat`={context.get('lat', 52.2297)}, `destination_lng`={context.get('lng', 21.0122)}, and `date`="{start_date}".
3. Answer any user questions about travel logistics, estimated costs/budget ({budget} PLN), accommodations, festival rules, and lineup advice using the travel data retrieved.
4. Event Discovery: When the user asks for festivals or events in a specific timeframe (date range) or geographic area (city, country, or 'Europe'), intelligently invoke the `discover_festivals` tool with appropriate parameters (`location_type`, `location_value`, `date_from`, `date_to`, `genres`).
5. Artist Checking: Use `search_artist_events` ONLY with specific artist/band names (e.g., 'Arctic Monkeys', 'Dua Lipa') to check their upcoming tour dates. NEVER pass a festival name as an artist name to `search_artist_events`.
6. Coordinates & Mapping: When `discover_festivals` or `search_artist_events` returns events with venue geographic coordinates (`latitude` and `longitude`), clearly summarize these coordinates or note that raw festival coordinates have been saved for frontend mapping and location visualization.

User context/preferences:
- Favorite genres: {genres_str}
- Budget: {budget} PLN
- Traveling from: {travel_from}

Always provide a detailed, highly engaging, structured markdown response."""

    user_messages = list(state.get("messages", []))
    is_initial_turn = len(user_messages) == 0

    if is_initial_turn:
        initial_human_msg = HumanMessage(
            content=(
                f"Please provide concierge advice, lineup highlights, and travel tips for {festival_name} "
                f"(Location: {location}, Dates: {start_date}{f' to {end_date}' if end_date else ''}).\n"
                f"User preferences -> Music genres: {genres_str}, Budget: {budget} PLN, Traveling from: {travel_from}.\n"
                f"Use `discover_festivals`, `search_artist_events`, or `get_travel_options` tools as needed to discover events, check tour dates, or plan transport."
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

    # Extract discovered festivals with coordinates across messages
    discovered_festivals = list(state.get("discovered_festivals", [])) if isinstance(state, dict) else []
    seen_ids = {f.get("id") for f in discovered_festivals if isinstance(f, dict) and f.get("id")}

    for msg in user_messages + [llm_response]:
        if hasattr(msg, "content") and isinstance(msg.content, str):
            try:
                data = json.loads(msg.content)
                if isinstance(data, dict) and "_embedded" in data and "events" in data["_embedded"]:
                    for ev in data["_embedded"]["events"]:
                        ev_id = ev.get("id")
                        if ev_id and ev_id not in seen_ids:
                            seen_ids.add(ev_id)
                            discovered_festivals.append(ev)
            except Exception:
                pass

    if is_initial_turn:
        return {"messages": [user_messages[0], llm_response]}
    return {"messages": [llm_response]}

