import pytest
import respx
from httpx import Response
from app.api.external.maps import GoogleMapsClient


@pytest.mark.asyncio
async def test_google_maps_client_sad_path_missing_api_key(mocker):
    mocker.patch("app.core.config.settings.GOOGLE_MAPS_API_KEY", None)
    res = await GoogleMapsClient.get_directions("Warsaw", "Krakow")
    assert "error" in res
    assert "not configured" in res["error"].lower()


@pytest.mark.asyncio
@respx.mock
async def test_google_maps_client_happy_path(mocker):
    mocker.patch("app.core.config.settings.GOOGLE_MAPS_API_KEY", "dummy_maps_key")

    mock_resp = {"status": "OK", "routes": [{"legs": [{"distance": {"text": "295 km"}}]}]}
    respx.get("https://maps.googleapis.com/maps/api/directions/json").mock(
        return_value=Response(200, json=mock_resp)
    )

    res = await GoogleMapsClient.get_directions("Warsaw", "Krakow")
    assert res["status"] == "OK"
    assert "routes" in res


@pytest.mark.asyncio
@respx.mock
async def test_google_maps_client_sad_path_http_error(mocker):
    mocker.patch("app.core.config.settings.GOOGLE_MAPS_API_KEY", "dummy_maps_key")

    respx.get("https://maps.googleapis.com/maps/api/directions/json").mock(
        return_value=Response(500, text="Internal Server Error")
    )

    res = await GoogleMapsClient.get_directions("Warsaw", "Krakow")
    assert "error" in res
    assert "trasie" in res["error"].lower()
