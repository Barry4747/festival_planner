from typing import Annotated, List, TypedDict
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    budget: float = Field(description="Maximum budget")
    travel_from: str = Field(description="Starting city")
    music_genres: List[str] = Field(
        default_factory=list, description="Favorite music genres"
    )


class TripDetails(BaseModel):
    festival_name: str
    start_date: str
    end_date: str
    location: str


class PlannerState(TypedDict):
    messages: Annotated[List[AnyMessage], add_messages]
    trip_details: TripDetails
    user_preferences: UserPreferences
    artist_data: List[dict]
    final_itinerary: str
