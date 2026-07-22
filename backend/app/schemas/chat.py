"""Shared Pydantic request/response schemas for chat-related endpoints."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class BaseChatRequest(BaseModel):
    """Common fields shared by all chat-related requests."""

    message: str = Field(..., min_length=1, max_length=4000)
    context: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, Any]]] = None


class FestivalChatRequest(BaseChatRequest):
    """Full chat request body sent by the festival concierge panel."""

    festival_id: Optional[str] = None
    festival_context: Optional[Dict[str, Any]] = None
