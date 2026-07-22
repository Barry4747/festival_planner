import pytest
from unittest.mock import AsyncMock, patch


def test_get_weather_endpoint_happy_path(client):
    with patch("app.api.routers.planner.fetch_weather", new_callable=AsyncMock) as mock_weather:
        mock_weather.return_value = {"city": "Warsaw", "forecast": []}

        response = client.get("/api/weather?city=Warsaw")
        assert response.status_code == 200
        assert response.json()["city"] == "Warsaw"


def test_get_current_weather_endpoint_happy_path(client):
    with patch("app.api.routers.planner.fetch_current_weather", new_callable=AsyncMock) as mock_current:
        mock_current.return_value = {"city": "Warsaw", "temp": 24.0}

        response = client.get("/api/weather/current?lat=52.2297&lon=21.0122")
        assert response.status_code == 200
        assert response.json()["temp"] == 24.0


def test_festivals_suggest_endpoint_happy_path(client):
    with patch("app.services.FestivalSuggestionService.submit_suggestion", new_callable=AsyncMock) as mock_sug:
        mock_sug.return_value = {"status": "success", "id": "sug-123"}

        payload = {"suggested_name": "Rock Festival", "suggested_city": "Warsaw"}
        response = client.post("/api/festivals/suggest", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "success"


def test_festivals_map_endpoint_happy_path(client):
    with patch("app.services.FestivalDiscoveryService.discover_festivals_map", new_callable=AsyncMock) as mock_map:
        mock_map.return_value = [{"id": "fest-1", "name": "Opener"}]

        response = client.get("/api/festivals/map?lat=54.5189&lng=18.5305&radius_km=50")
        assert response.status_code == 200
        assert len(response.json()) == 1


def test_plan_trip_legacy_endpoint_happy_path(client):
    with patch("app.services.FestivalConciergeService.generate_trip_itinerary", new_callable=AsyncMock) as mock_itin:
        mock_itin.return_value = {
            "content": "Sample itinerary",
            "discovered_festivals": [],
            "raw_festivals": []
        }

        payload = {
            "trip_details": {
                "festival_name": "Opener",
                "start_date": "2026-07-01",
                "end_date": "2026-07-04",
                "location": "Gdynia"
            },
            "user_preferences": {
                "budget": 1000.0,
                "travel_from": "Warsaw",
                "music_genres": ["rock"]
            }
        }
        response = client.post("/api/plan-trip", json=payload)
        assert response.status_code == 200
        assert "itinerary" in response.json()["content"].lower()
