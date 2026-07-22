import pytest
import respx
from httpx import Response
from app.services.weather import fetch_weather, fetch_current_weather


@pytest.mark.asyncio
async def test_fetch_weather_sad_path_far_future_date():
    res = await fetch_weather(city="Warsaw", date="2030-01-01")
    assert "error" in res
    assert "unavailable" in res["error"].lower()


@pytest.mark.asyncio
@respx.mock
async def test_fetch_weather_happy_path(mocker):
    mocker.patch("app.core.config.settings.OPENWEATHER_API_KEY", "dummy_weather_key")
    
    mock_payload = {
        "city": {"name": "Warsaw"},
        "list": [
            {
                "dt_txt": "2026-07-25 12:00:00",
                "main": {"temp": 25.0, "temp_min": 20.0, "temp_max": 28.0},
                "weather": [{"main": "Clear", "icon": "01d"}]
            }
        ]
    }
    respx.get("https://api.openweathermap.org/data/2.5/forecast").mock(
        return_value=Response(200, json=mock_payload)
    )

    res = await fetch_weather(city="Warsaw")
    assert "city" in res
    assert res["city"] == "Warsaw"
    assert len(res["forecast"]) == 1


@pytest.mark.asyncio
@respx.mock
async def test_fetch_weather_sad_path_api_error(mocker):
    mocker.patch("app.core.config.settings.OPENWEATHER_API_KEY", "dummy_weather_key")
    respx.get("https://api.openweathermap.org/data/2.5/forecast").mock(
        return_value=Response(500, text="Internal Server Error")
    )

    res = await fetch_weather(city="Warsaw")
    assert "error" in res
    assert "500" in res["error"]


@pytest.mark.asyncio
@respx.mock
async def test_fetch_current_weather_happy_path(mocker):
    mocker.patch("app.core.config.settings.OPENWEATHER_API_KEY", "dummy_weather_key")
    mock_payload = {
        "name": "Warsaw",
        "main": {"temp": 22.5},
        "wind": {"speed": 5.0, "deg": 180},
        "weather": [{"main": "Clouds", "icon": "03d"}]
    }
    respx.get("https://api.openweathermap.org/data/2.5/weather").mock(
        return_value=Response(200, json=mock_payload)
    )

    res = await fetch_current_weather(lat=52.2297, lon=21.0122)
    assert res["city"] == "Warsaw"
    assert res["temp"] == 22.5
    assert res["wind_speed"] == 18.0  # 5.0 m/s * 3.6 = 18 km/h
