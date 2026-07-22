import pytest
from unittest.mock import AsyncMock, patch


def test_transport_routes_endpoint_happy_path(client):
    with patch("app.api.routers.transport.geocode_city", new_callable=AsyncMock) as mock_geo, \
         patch("app.api.routers.transport.reverse_geocode_coords", new_callable=AsyncMock) as mock_rev, \
         patch("app.api.routers.transport.get_car_route", new_callable=AsyncMock) as mock_car, \
         patch("app.api.routers.transport.get_google_directions", new_callable=AsyncMock) as mock_train:

        mock_geo.return_value = (52.2297, 21.0122)
        mock_rev.return_value = "Gdynia"
        mock_car.return_value = {
            "geometry": [[52.2297, 21.0122], [54.5189, 18.5305]],
            "estimated_time": "4h 0m",
            "duration_hours": 4,
            "duration_minutes": 0,
            "estimated_fuel_cost_pln": 150.0,
            "distance_km": 350.0,
            "status": "success"
        }
        mock_train.return_value = {
            "status": "success",
            "total_duration": "3h 30m",
            "distance": "360 km",
            "steps": [],
            "route_coordinates": []
        }

        url = "/api/transport/routes?origin_city=Warsaw&dest_lat=54.5189&dest_lng=18.5305&date=2026-07-01"
        response = client.get(url)

        assert response.status_code == 200
        data = response.json()
        assert "car" in data
        assert "train" in data
        assert data["car"]["duration"] == "4h 0m"
        assert data["train"]["total_duration"] == "3h 30m"


def test_transport_routes_sad_path_missing_required_params(client):
    response = client.get("/api/transport/routes?origin_city=Warsaw")
    assert response.status_code == 422
