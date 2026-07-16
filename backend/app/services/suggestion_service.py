import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.repositories import FestivalRepository

logger = logging.getLogger(__name__)


class FestivalSuggestionService:
    """Service encapsulating business rules and workflows for user festival suggestions."""

    def __init__(self, repository: FestivalRepository):
        self.repository = repository

    async def submit_suggestion(
        self,
        name: str,
        city: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not name.strip() or not city.strip():
            raise HTTPException(status_code=400, detail="Festival name and city are required.")

        try:
            row = await self.repository.save_suggestion(
                name=name,
                city=city,
                start_date=start_date,
                end_date=end_date,
                user_id=user_id,
            )
            inserted_id = row.get("id", "submitted") if isinstance(row, dict) else "submitted"
            return {
                "status": "success",
                "id": inserted_id,
                "message": "Thank you! We will review and add this to our database.",
            }
        except Exception as e:
            logger.error(f"❌ [FestivalSuggestionService] Failed to save suggestion: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save suggestion: {str(e)}")
