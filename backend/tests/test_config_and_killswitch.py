import pytest
import os
from unittest.mock import patch

from app.core.config import Settings
from app.main import app

def test_settings_bypass_gemini_key_validation_in_prod():
    """
    Testuje fail-fast walidację configu (2.1) - sprawdza czy przy braku klucza Gemini
    serwer wstaje, o ile ENVIRONMENT="production".
    (Klucz jest opcjonalny, brak klucza to tzw. kill-switch).
    """
    # Symulujemy minimalne środowisko produkcyjne
    env_vars = {
        "ENVIRONMENT": "production",
        "FRONTEND_URL": "http://localhost",
        "ALLOWED_ORIGINS": "http://localhost",
        "SUPABASE_URL": "http://test",
        "SUPABASE_KEY": "test",
        "SUPABASE_SERVICE_ROLE_KEY": "test",
        "DATABASE_URL": "postgresql://test",
        "TICKETMASTER_API_KEY": "test",
        "OPENWEATHER_API_KEY": "test",
        "GOOGLE_MAPS_API_KEY": "test",
        "REDIS_URL": "redis://localhost:6379",
        "GEMINI_API_KEY": "" # BRAK KLUCZA
    }
    
    with patch.dict(os.environ, env_vars, clear=True):
        # Powinno się zainicjować bez pydantic_core._pydantic_core.ValidationError
        s = Settings()
        assert s.GEMINI_API_KEY == ""
        assert s.ai_chat_enabled is False


@pytest.mark.asyncio
async def test_chat_disabled_fallback_returns_503(client):
    """
    Sprawdza, że endpoint czatu zwraca 503 z kodem "chat_unavailable" 
    jeśli settings.ai_chat_enabled = False (brak GEMINI_API_KEY).
    """
    from unittest.mock import PropertyMock
    with patch("app.core.config.Settings.ai_chat_enabled", new_callable=PropertyMock) as mock_enabled:
        mock_enabled.return_value = False
        payload = {"message": "Hello", "history": []}
        response = client.post("/api/chat/", json=payload)
        
        assert response.status_code == 503
        data = response.json()
        assert data["error"] == "chat_unavailable"
        assert "niedostępny" in data["message"]
