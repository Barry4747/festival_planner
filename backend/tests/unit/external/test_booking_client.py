import pytest
import respx
from httpx import Response
from app.api.external.accommodation import BookingClient


@pytest.mark.asyncio
async def test_booking_client_sad_path_missing_api_key(mocker):
    mocker.patch("app.core.config.settings.BOOKING_API_KEY", None)
    res = await BookingClient.search_hotels("Warsaw", "2026-07-20", "2026-07-22")
    assert "error" in res
    assert "not configured" in res["error"].lower()


@pytest.mark.asyncio
@respx.mock
async def test_booking_client_happy_path(mocker):
    mocker.patch("app.core.config.settings.BOOKING_API_KEY", "dummy_booking_key")

    mock_resp = {"result": [{"hotel_name": "Grand Hotel", "price": 150.0}]}
    respx.get("https://api.booking.com/v1/hotels/search").mock(
        return_value=Response(200, json=mock_resp)
    )

    res = await BookingClient.search_hotels("Warsaw", "2026-07-20", "2026-07-22")
    assert "result" in res
    assert res["result"][0]["hotel_name"] == "Grand Hotel"


@pytest.mark.asyncio
@respx.mock
async def test_booking_client_sad_path_http_status_error(mocker):
    mocker.patch("app.core.config.settings.BOOKING_API_KEY", "dummy_booking_key")

    respx.get("https://api.booking.com/v1/hotels/search").mock(
        return_value=Response(403, text="Forbidden")
    )

    res = await BookingClient.search_hotels("Warsaw", "2026-07-20", "2026-07-22")
    assert "error" in res
    assert "hotelach" in res["error"].lower()
