import pytest
import respx
from httpx import Response
from app.api.external.events import TicketmasterClient


@pytest.mark.asyncio
@respx.mock
async def test_ticketmaster_search_events_happy_path(mocker):
    mocker.patch("app.core.config.settings.TICKETMASTER_API_KEY", "dummy_tm_key")

    mock_resp = {
        "_embedded": {
            "events": [{"id": "ev-1", "name": "Polyphia Live", "type": "event"}]
        }
    }
    respx.get("https://app.ticketmaster.com/discovery/v2/events.json").mock(
        return_value=Response(200, json=mock_resp)
    )

    res = await TicketmasterClient.search_events(city="Warsaw", country_code="PL")
    assert "_embedded" in res
    assert res["_embedded"]["events"][0]["name"] == "Polyphia Live"


@pytest.mark.asyncio
@respx.mock
async def test_ticketmaster_search_events_europe_concurrent_queries(mocker):
    mocker.patch("app.core.config.settings.TICKETMASTER_API_KEY", "dummy_tm_key")

    mock_resp = {"_embedded": {"events": [{"id": "ev-eur", "name": "Euro Fest"}]}}
    respx.get("https://app.ticketmaster.com/discovery/v2/events.json").mock(
        return_value=Response(200, json=mock_resp)
    )

    # Country_code="europe" triggers concurrent queries for 7 European countries
    res = await TicketmasterClient.search_events(country_code="europe")
    assert "_embedded" in res
    assert len(res["_embedded"]["events"]) > 0


@pytest.mark.asyncio
@respx.mock
async def test_ticketmaster_search_events_sad_path_429_rate_limit(mocker):
    mocker.patch("app.core.config.settings.TICKETMASTER_API_KEY", "dummy_tm_key")

    respx.get("https://app.ticketmaster.com/discovery/v2/events.json").mock(
        return_value=Response(429, text="Rate limit exceeded")
    )

    res = await TicketmasterClient.search_events(city="Berlin")
    assert "error" in res
    assert "rate limit" in res["error"].lower()


@pytest.mark.asyncio
@respx.mock
async def test_ticketmaster_search_events_sad_path_http_status_error(mocker):
    mocker.patch("app.core.config.settings.TICKETMASTER_API_KEY", "dummy_tm_key")

    respx.get("https://app.ticketmaster.com/discovery/v2/events.json").mock(
        return_value=Response(500, text="Internal Server Error")
    )

    res = await TicketmasterClient.search_events(city="Prague")
    assert "error" in res
    assert "Nie udało się" in res["error"]
