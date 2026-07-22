import os
import pytest
from unittest.mock import patch, PropertyMock

from app.core.config import Settings


def test_settings_bypass_gemini_key_validation_in_prod():
    """
    Testuje walidację configu — sprawdza czy przy braku klucza Gemini
    serwer wstaje na produkcji (klucz Gemini jest opcjonalny, brak klucza to kill-switch).
    """
    env_vars = {
        "ENVIRONMENT": "production",
        "FRONTEND_URL": "http://localhost",
        "ALLOWED_ORIGINS": "https://lineup.app",
        "SUPABASE_URL": "http://test",
        "SUPABASE_KEY": "test",
        "SUPABASE_SERVICE_ROLE_KEY": "test",
        "DATABASE_URL": "postgresql://test",
        "TICKETMASTER_API_KEY": "test",
        "OPENWEATHER_API_KEY": "test",
        "GOOGLE_MAPS_API_KEY": "test",
        "REDIS_URL": "redis://localhost:6379",
        "GEMINI_API_KEY": ""  # BRAK KLUCZA
    }
    
    with patch.dict(os.environ, env_vars, clear=True):
        s = Settings()
        assert s.GEMINI_API_KEY == ""
        assert s.ai_chat_enabled is False


def test_cors_origins_parsing_from_comma_separated_string():
    env_vars = {
        "ENVIRONMENT": "development",
        "FRONTEND_URL": "http://localhost",
        "ALLOWED_ORIGINS": "http://localhost:5173, https://app.domain.com",
        "SUPABASE_URL": "http://test",
        "SUPABASE_KEY": "test",
        "SUPABASE_SERVICE_ROLE_KEY": "test",
        "DATABASE_URL": "postgresql://test",
    }
    with patch.dict(os.environ, env_vars, clear=True):
        s = Settings()
        assert "http://localhost:5173" in s.ALLOWED_ORIGINS
        assert "https://app.domain.com" in s.ALLOWED_ORIGINS


@pytest.mark.asyncio
async def test_chat_disabled_fallback_returns_503(client):
    """
    Sprawdza, że endpoint czatu zwraca 503 z kodem "chat_unavailable" 
    jeśli settings.ai_chat_enabled = False (brak GEMINI_API_KEY).
    """
    with patch("app.core.config.Settings.ai_chat_enabled", new_callable=PropertyMock) as mock_enabled:
        mock_enabled.return_value = False
        payload = {"message": "Hello", "history": []}
        response = client.post("/api/chat/", json=payload)
        
        assert response.status_code == 503
        data = response.json()
        assert data["error"] == "chat_unavailable"
        assert "niedostępny" in data["message"]
