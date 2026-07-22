import pytest
import respx
from httpx import Response
from app.services.transport import (
    _calculate_haversine_km,
    geocode_city,
    get_car_route,
    get_google_directions
)


def test_haversine_distance_calculation():
    # Warsaw (52.2297, 21.0122) to Krakow (50.0647, 19.9450) ~ 250 km
    dist = _calculate_haversine_km(52.2297, 21.0122, 50.0647, 19.9450)
    assert 240 <= dist <= 260


@pytest.mark.asyncio
@respx.mock
async def test_geocode_city_fallback_to_constants():
    # Mock nominatim failure so fallback to CITY_COORDS triggers
    respx.get("https://nominatim.openstreetmap.org/search").mock(
        return_value=Response(500, text="Service Unavailable")
    )
    lat, lng = await geocode_city("Krakow")
    assert lat == 50.0647
    assert lng == 19.9450


@pytest.mark.asyncio
@respx.mock
async def test_geocode_city_unknown_city_default():
    respx.get("https://nominatim.openstreetmap.org/search").mock(
        return_value=Response(200, json=[])
    )
    lat, lng = await geocode_city("UnknownNonExistentCityXYZ")
    assert lat == 52.2297  # Warsaw default
    assert lng == 21.0122


@pytest.mark.asyncio
@respx.mock
async def test_get_car_route_happy_path():
    osrm_response = {
        "code": "Ok",
        "routes": [
            {
                "duration": 3600.0,
                "distance": 100000.0,
                "geometry": {"coordinates": [[21.0122, 52.2297], [19.9450, 50.0647]]}
            }
        ]
    }
    respx.get("http://router.project-osrm.org/route/v1/driving/21.0122,52.2297;19.945,50.0647").mock(
        return_value=Response(200, json=osrm_response)
    )

    res = await get_car_route(52.2297, 21.0122, 50.0647, 19.9450)
    assert res["status"] == "success"
    assert res["distance_km"] == 100.0
    assert res["duration_hours"] == 1


@pytest.mark.asyncio
@respx.mock
async def test_get_car_route_fallback_on_osrm_failure():
    respx.get("http://router.project-osrm.org/route/v1/driving/21.0122,52.2297;19.945,50.0647").mock(
        return_value=Response(500, text="OSRM Down")
    )

    res = await get_car_route(52.2297, 21.0122, 50.0647, 19.9450)
    assert res["status"] == "fallback_estimated"
    assert res["distance_km"] > 0


@pytest.mark.asyncio
@respx.mock
async def test_get_google_directions_happy_path(mocker):
    mocker.patch("app.core.config.settings.GOOGLE_MAPS_API_KEY", "dummy_maps_key")
    
    mock_directions = {
        "status": "OK",
        "routes": [{
            "legs": [{
                "duration": {"text": "2 hours"},
                "distance": {"text": "300 km"},
                "steps": []
            }]
        }]
    }
    respx.get("https://maps.googleapis.com/maps/api/directions/json").mock(
        return_value=Response(200, json=mock_directions)
    )

    res = await get_google_directions("Warsaw", "Krakow", mode="transit")
    assert res["status"] == "success"
    assert res["total_duration"] == "2 hours"


@pytest.mark.asyncio
async def test_get_google_directions_sad_path_missing_api_key(mocker):
    mocker.patch("app.core.config.settings.GOOGLE_MAPS_API_KEY", "")
    res = await get_google_directions("Warsaw", "Krakow")
    assert res["status"] == "error"
    assert "missing" in res["message"].lower()
