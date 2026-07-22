"""Package marker and exports for all Pydantic schemas."""
from .auth import EmailPasswordRequest
from .chat import BaseChatRequest, FestivalChatRequest
from .planner import SuggestFestivalRequest, TripDetailsModel, UserPreferencesModel
from .trips import TripRequest

__all__ = [
    "EmailPasswordRequest",
    "BaseChatRequest",
    "FestivalChatRequest",
    "SuggestFestivalRequest",
    "TripDetailsModel",
    "UserPreferencesModel",
    "TripRequest",
]
