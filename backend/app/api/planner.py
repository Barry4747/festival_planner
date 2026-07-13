from fastapi import APIRouter
from app.agents.graph import planner_app
from app.agents.state import TripDetails, UserPreferences

router = APIRouter()


@router.post("/plan-trip")
async def plan_trip(trip_details: TripDetails, user_preferences: UserPreferences):
    initial_state = {
        "messages": [],
        "trip_details": trip_details.model_dump(),
        "user_preferences": user_preferences.model_dump(),
    }
    result = await planner_app.ainvoke(initial_state)
    messages = result.get("messages", [])
    for m in reversed(messages):
        if getattr(m, "type", "") == "ai" or type(m).__name__ == "AIMessage":
            return m
    return messages[-1] if messages else {"error": "No messages generated"}
