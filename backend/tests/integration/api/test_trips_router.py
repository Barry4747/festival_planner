import pytest
from unittest.mock import MagicMock
from app.db.database import get_supabase_client
from app.main import app


def test_get_saved_trips_happy_path(client):
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_order = MagicMock()

    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.order.return_value = mock_order

    class MockResponse:
        data = [{"id": "trip-1", "festival_name": "Opener", "festival_id": "fest-1"}]

    mock_order.execute.return_value = MockResponse()

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get("/api/trips/")
        assert response.status_code == 200
        assert len(response.json()) == 1
    finally:
        from tests.conftest import override_get_supabase_client
        app.dependency_overrides[get_supabase_client] = override_get_supabase_client


def test_save_trip_happy_path(client):
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_upsert = MagicMock()

    mock_supabase.table.return_value = mock_table
    mock_table.upsert.return_value = mock_upsert

    class MockResponse:
        data = [{"id": "trip-1", "festival_id": "fest-1", "festival_name": "Opener"}]

    mock_upsert.execute.return_value = MockResponse()

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        payload = {
            "festival_id": "fest-1",
            "festival_name": "Opener",
            "festival_data": {"city": "Gdynia"}
        }
        response = client.post("/api/trips/", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "success"
    finally:
        from tests.conftest import override_get_supabase_client
        app.dependency_overrides[get_supabase_client] = override_get_supabase_client


def test_delete_trip_happy_path(client):
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_delete = MagicMock()
    mock_eq1 = MagicMock()
    mock_eq2 = MagicMock()

    mock_supabase.table.return_value = mock_table
    mock_table.delete.return_value = mock_delete
    mock_delete.eq.return_value = mock_eq1
    mock_eq1.eq.return_value = mock_eq2

    class MockResponse:
        data = []

    mock_eq2.execute.return_value = MockResponse()

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.delete("/api/trips/fest-1")
        assert response.status_code == 200
        assert response.json()["status"] == "success"
    finally:
        from tests.conftest import override_get_supabase_client
        app.dependency_overrides[get_supabase_client] = override_get_supabase_client
