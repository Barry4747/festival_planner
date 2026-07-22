import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from app.services.suggestion_service import FestivalSuggestionService


@pytest.mark.asyncio
async def test_submit_suggestion_happy_path():
    repo = MagicMock()
    repo.save_suggestion = AsyncMock(return_value={"id": "sug-123", "suggested_name": "Rock Fest"})

    service = FestivalSuggestionService(repo)
    res = await service.submit_suggestion(name="Rock Fest", city="Warsaw", user_id="user-1")

    assert res["status"] == "success"
    assert res["id"] == "sug-123"


@pytest.mark.asyncio
async def test_submit_suggestion_sad_path_missing_required_fields():
    repo = MagicMock()
    service = FestivalSuggestionService(repo)

    with pytest.raises(HTTPException) as exc_info:
        await service.submit_suggestion(name="", city="Warsaw")
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info:
        await service.submit_suggestion(name="Fest", city="   ")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_submit_suggestion_sad_path_repo_exception():
    repo = MagicMock()
    repo.save_suggestion = AsyncMock(side_effect=Exception("Database connection error"))

    service = FestivalSuggestionService(repo)
    with pytest.raises(HTTPException) as exc_info:
        await service.submit_suggestion(name="Opener", city="Gdynia")
    assert exc_info.value.status_code == 500
