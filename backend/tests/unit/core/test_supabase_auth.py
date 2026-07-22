import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException, Request
from app.core.supabase import get_current_user


def make_mock_request(cookies=None):
    req = MagicMock(spec=Request)
    req.cookies = cookies or {}
    return req


@pytest.mark.asyncio
async def test_get_current_user_from_auth_header(mocker):
    mock_supabase = MagicMock()
    mock_user_resp = MagicMock()
    mock_user_resp.user = MagicMock()
    mock_user_resp.user.model_dump.return_value = {"id": "usr-header", "email": "usr@example.com"}
    mock_supabase.auth.get_user.return_value = mock_user_resp

    mocker.patch("app.core.supabase.get_supabase", return_value=mock_supabase)

    req = make_mock_request()
    user = await get_current_user(request=req, authorization="Bearer valid-token", supabase=mock_supabase)
    assert user["id"] == "usr-header"


@pytest.mark.asyncio
async def test_get_current_user_from_cookie(mocker):
    mock_supabase = MagicMock()
    mock_user_resp = MagicMock()
    mock_user_resp.user = MagicMock()
    mock_user_resp.user.model_dump.return_value = {"id": "usr-cookie", "email": "cookie@example.com"}
    mock_supabase.auth.get_user.return_value = mock_user_resp

    mocker.patch("app.core.supabase.get_supabase", return_value=mock_supabase)

    req = make_mock_request(cookies={"access_token": "cookie-token"})
    user = await get_current_user(request=req, authorization=None, supabase=mock_supabase)
    assert user["id"] == "usr-cookie"


@pytest.mark.asyncio
async def test_get_current_user_sad_path_missing_token():
    mock_supabase = MagicMock()
    req = make_mock_request()
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(request=req, authorization=None, supabase=mock_supabase)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_sad_path_invalid_token(mocker):
    mock_supabase = MagicMock()
    mock_supabase.auth.get_user.side_effect = Exception("Invalid JWT signature")

    mocker.patch("app.core.supabase.get_supabase", return_value=mock_supabase)

    req = make_mock_request()
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(request=req, authorization="Bearer invalid-token", supabase=mock_supabase)
    assert exc_info.value.status_code == 401
