"""Chat router — entity-bound AI concierge chatbot."""
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.rate_limit import check_rate_limit
from app.core.supabase import get_current_user
from app.dependencies import get_concierge_service
from app.schemas.chat import FestivalChatRequest
from app.services import FestivalConciergeService
from langgraph.errors import GraphRecursionError

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_user_id(user: Dict[str, Any]) -> str:
    """Extract and validate user ID from the token payload."""
    user_id = user.get("id") or user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user session.",
        )
    return str(user_id)


@router.get("/history/{festival_id}", response_model=List[Dict[str, Any]])
async def get_chat_history(
    festival_id: str = Path(..., description="ID of the festival"),
    user: Dict[str, Any] = Depends(get_current_user),
    service: FestivalConciergeService = Depends(get_concierge_service),
) -> List[Dict[str, Any]]:
    """Fetch paginated chat history for the authenticated user and given festival."""
    user_id = _get_user_id(user)
    return await service.get_chat_history_for_festival(
        user_id=user_id, festival_id=festival_id
    )


@router.post("/", response_model=Dict[str, Any])
async def chat_endpoint(
    request: FestivalChatRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    service: FestivalConciergeService = Depends(get_concierge_service),
    _rate_limit: dict = Depends(check_rate_limit("ai_agent")),
) -> Dict[str, Any]:
    """Entity-bound AI concierge chat endpoint.

    Orchestrates thread creation/retrieval, LangGraph execution with history,
    and DB message persistence. Requires JWT authentication.
    """
    user_id = _get_user_id(user)
    try:
        return await service.generate_chat_response(
            message=request.message,
            festival_id=request.festival_id,
            festival_context=request.festival_context,
            context=request.context,
            history=request.history,
            user_id=user_id,
        )
    except GraphRecursionError:
        raise HTTPException(
            status_code=422,
            detail="Przekroczono limit prób wywołania narzędzi przez Agenta AI. Spróbuj sformułować zapytanie inaczej."
        )
