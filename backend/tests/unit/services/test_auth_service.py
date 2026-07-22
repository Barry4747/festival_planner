import pytest
from unittest.mock import MagicMock
from app.services.auth_service import AuthService


@pytest.mark.asyncio
async def test_login_with_password_happy_path(mock_supabase):
    mock_auth = MagicMock()
    mock_session = MagicMock()
    mock_session.access_token = "mock-access-token"
    mock_session.refresh_token = "mock-refresh-token"
    mock_session.expires_in = 3600
    
    mock_user = MagicMock()
    mock_user.model_dump.return_value = {"id": "user-123", "email": "test@example.com"}
    
    mock_response = MagicMock()
    mock_response.session = mock_session
    mock_response.user = mock_user
    mock_auth.sign_in_with_password.return_value = mock_response
    mock_supabase.auth = mock_auth

    service = AuthService(mock_supabase)
    res = await service.login_with_password("test@example.com", "password123")

    assert res["access_token"] == "mock-access-token"
    assert res["refresh_token"] == "mock-refresh-token"
    assert res["user"]["id"] == "user-123"


@pytest.mark.asyncio
async def test_login_with_password_sad_path_invalid_credentials(mock_supabase):
    mock_auth = MagicMock()
    mock_auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
    mock_supabase.auth = mock_auth

    service = AuthService(mock_supabase)
    with pytest.raises(Exception) as exc_info:
        await service.login_with_password("wrong@example.com", "wrongpass")
    assert "Invalid login credentials" in str(exc_info.value)


@pytest.mark.asyncio
async def test_signup_with_password_happy_path(mock_supabase):
    mock_auth = MagicMock()
    mock_user = MagicMock()
    mock_user.model_dump.return_value = {"id": "new-user-id", "email": "new@example.com"}
    mock_response = MagicMock()
    mock_response.user = mock_user
    mock_auth.sign_up.return_value = mock_response
    mock_supabase.auth = mock_auth

    service = AuthService(mock_supabase)
    res = await service.signup_with_password("new@example.com", "securepassword")

    assert res["user"]["id"] == "new-user-id"


@pytest.mark.asyncio
async def test_get_oauth_url_happy_path(mock_supabase):
    mock_auth = MagicMock()
    mock_response = MagicMock()
    mock_response.url = "https://accounts.google.com/o/oauth2/v2/auth?..."
    mock_auth.sign_in_with_oauth.return_value = mock_response
    mock_supabase.auth = mock_auth

    service = AuthService(mock_supabase)
    url = await service.get_oauth_url("google", "http://localhost/callback")

    assert "google.com" in url


@pytest.mark.asyncio
async def test_exchange_code_for_session_happy_path(mock_supabase):
    mock_auth = MagicMock()
    mock_session = MagicMock()
    mock_session.access_token = "oauth-access-token"
    mock_session.refresh_token = "oauth-refresh-token"
    mock_session.expires_in = 3600
    mock_user = MagicMock()
    mock_user.model_dump.return_value = {"id": "google-user-id"}
    
    mock_response = MagicMock()
    mock_response.session = mock_session
    mock_response.user = mock_user
    mock_auth.exchange_code_for_session.return_value = mock_response
    mock_supabase.auth = mock_auth

    service = AuthService(mock_supabase)
    res = await service.exchange_code_for_session("valid-code")

    assert res["access_token"] == "oauth-access-token"
