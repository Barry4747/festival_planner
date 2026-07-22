import pytest
from unittest.mock import AsyncMock, patch


def test_signup_endpoint_happy_path(client):
    with patch("app.api.routers.auth.AuthService.signup_with_password", new_callable=AsyncMock) as mock_signup:
        mock_signup.return_value = {"user": {"id": "user-signup-1", "email": "new@example.com"}}

        response = client.post("/api/auth/signup", json={"email": "new@example.com", "password": "Password123!"})
        assert response.status_code == 200
        assert response.json()["user"]["id"] == "user-signup-1"


def test_signup_endpoint_sad_path_invalid_email(client):
    response = client.post("/api/auth/signup", json={"email": "not-an-email", "password": "short"})
    assert response.status_code == 422


def test_login_endpoint_happy_path_sets_cookies(client):
    with patch("app.api.routers.auth.AuthService.login_with_password", new_callable=AsyncMock) as mock_login:
        mock_login.return_value = {
            "access_token": "acc-token",
            "refresh_token": "ref-token",
            "expires_in": 3600,
            "user": {"id": "usr-1", "email": "login@example.com"}
        }

        response = client.post("/api/auth/login", json={"email": "login@example.com", "password": "Password123!"})
        assert response.status_code == 200
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies


def test_login_endpoint_sad_path_invalid_credentials(client):
    with patch("app.api.routers.auth.AuthService.login_with_password", new_callable=AsyncMock) as mock_login:
        mock_login.side_effect = Exception("Invalid login credentials")

        response = client.post("/api/auth/login", json={"email": "wrong@example.com", "password": "wrongpassword"})
        assert response.status_code == 401


def test_logout_endpoint_clears_cookies(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 200


def test_google_login_endpoint(client):
    with patch("app.api.routers.auth.AuthService.get_oauth_url", new_callable=AsyncMock) as mock_url:
        mock_url.return_value = "https://accounts.google.com/o/oauth2/..."

        response = client.get("/api/auth/google?redirect_to=http://localhost/callback")
        assert response.status_code == 200
        assert "google.com" in response.json()["url"]
