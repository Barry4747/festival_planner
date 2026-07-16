from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Path, HTTPException, status
from pydantic import BaseModel
from app.core.supabase import get_current_user
from app.dependencies import get_concierge_service
from app.services import FestivalConciergeService

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    festival_id: Optional[str] = None
    festival_context: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, Any]]] = None


@router.get("/history/{festival_id}")
async def get_chat_history(
    festival_id: str = Path(..., description="ID of the festival"),
    user: Dict[str, Any] = Depends(get_current_user),
    service: FestivalConciergeService = Depends(get_concierge_service),
) -> List[Dict[str, Any]]:
    """
    Fetch historical entity-bound chat messages for the authenticated user and given festival_id.
    Returns ordered list of messages, or empty list if thread does not exist.
    """
    user_id = user.get("id") or user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID in token"
        )

    return await service.get_chat_history_for_festival(
        user_id=str(user_id), festival_id=str(festival_id)
    )


@router.post("")
@router.post("/")
async def chat_endpoint(
    request: ChatRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    service: FestivalConciergeService = Depends(get_concierge_service),
) -> Dict[str, Any]:
    """
    Entity-Bound Generative AI Chatbot Concierge endpoint. Requires JWT authentication.
    Orchestrates thread creation/retrieval, LangGraph execution with history, and DB message persistence.
    """
    user_id = user.get("id") or user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID in token"
        )

    return await service.generate_chat_response(
        message=request.message,
        festival_id=request.festival_id,
        festival_context=request.festival_context,
        context=request.context,
        history=request.history,
        user_id=str(user_id),
    )
