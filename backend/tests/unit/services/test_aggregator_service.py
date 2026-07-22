import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.aggregator import FestivalAggregator, calculate_distance, _parse_date


def test_parse_date():
    assert _parse_date("2026-07-20") is not None
    assert _parse_date("invalid-date") is None


def test_calculate_distance():
    d = calculate_distance(52.2297, 21.0122, 52.2297, 21.0122)
    assert d == 0.0


@pytest.mark.asyncio
async def test_aggregator_deduplicates_similar_festivals():
    source1 = MagicMock()
    source1.search = AsyncMock(return_value=[
        {
            "id": "tm-1",
            "name": "Opener Festival 2026",
            "lat": 54.5189,
            "lng": 18.5305,
            "dates": {"start": {"localDate": "2026-07-01"}},
            "source": "ticketmaster"
        }
    ])

    source2 = MagicMock()
    source2.search = AsyncMock(return_value=[
        {
            "id": "db-1",
            "name": "Opener Festival",
            "lat": 54.5190,
            "lng": 18.5300,
            "dates": {"start": {"localDate": "2026-07-01"}},
            "source": "local_db"
        }
    ])

    aggregator = FestivalAggregator([source1, source2])
    res = await aggregator.aggregate_festivals(lat=54.5189, lng=18.5305, radius_km=50)

    # Should deduplicate similar festivals into 1 result
    assert len(res) == 1
    assert "Opener" in res[0]["name"]


@pytest.mark.asyncio
async def test_aggregator_handles_source_exception_gracefully():
    failing_source = MagicMock()
    failing_source.search = AsyncMock(side_effect=Exception("Source connection timeout"))

    working_source = MagicMock()
    working_source.search = AsyncMock(return_value=[
        {
            "id": "tm-2",
            "name": "Sunrise Festival",
            "lat": 54.1759,
            "lng": 15.5833,
            "dates": {"start": {"localDate": "2026-07-24"}},
            "source": "ticketmaster"
        }
    ])

    aggregator = FestivalAggregator([failing_source, working_source])
    res = await aggregator.aggregate_festivals(lat=54.1759, lng=15.5833, radius_km=50)

    assert len(res) == 1
    assert res[0]["name"] == "Sunrise Festival"
