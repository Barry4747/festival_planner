import pytest
from fastapi.testclient import TestClient
import fakeredis
from unittest.mock import patch, MagicMock
import os

# Set dummy environment variables to bypass Pydantic validation on load
os.environ["ENVIRONMENT"] = "development"
os.environ["FRONTEND_URL"] = "http://localhost"
os.environ["SUPABASE_URL"] = "http://localhost"
os.environ["SUPABASE_KEY"] = "dummy"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "dummy"
os.environ["DATABASE_URL"] = "postgresql://dummy"
os.environ["TICKETMASTER_API_KEY"] = "dummy"
os.environ["OPENWEATHER_API_KEY"] = "dummy"
os.environ["GOOGLE_MAPS_API_KEY"] = "dummy"
os.environ["GEMINI_API_KEY"] = "dummy"

from app.main import app
from app.core.supabase import get_current_user
from app.db.database import get_supabase_client

# Override get_current_user to bypass Supabase auth
async def override_get_current_user():
    return {"id": "test-user-id", "email": "test@example.com"}

# Override get_supabase_client to avoid real DB calls in rate limiter
async def override_get_supabase_client():
    mock_supabase = MagicMock()
    # Mock user_tiers response for the test user
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_execute = MagicMock()
    
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = mock_execute
    
    class MockResult:
        data = [{"tier": "FREE"}]
        
    mock_execute.return_value = MockResult()
    return mock_supabase

app.dependency_overrides[get_current_user] = override_get_current_user
app.dependency_overrides[get_supabase_client] = override_get_supabase_client


@pytest.fixture
def fake_redis():
    # Use FakeAsyncRedis for async redis operations
    return fakeredis.FakeAsyncRedis(decode_responses=True)


@pytest.fixture(autouse=True)
def mock_rate_limit_redis(fake_redis):
    # Patch the redis_client instance in rate_limit.py
    with patch("app.core.rate_limit.redis_client", fake_redis):
        yield fake_redis


@pytest.fixture
def client():
    # Using the standard TestClient for synchronous endpoint testing
    with TestClient(app) as c:
        yield c
