import pytest
from app.core.rate_limit import check_rate_limit
from app.core.tiers import TIER_CONFIG
from app.exceptions import RateLimitException


@pytest.mark.asyncio
async def test_free_tier_limits_requests(fake_redis, mock_supabase):
    limiter = check_rate_limit("ai_agent")
    user = {"id": "test-user-free"}

    limit_rpm = TIER_CONFIG["FREE"]["limits"]["ai_agent"]["rpm"]

    for _ in range(limit_rpm):
        await limiter(user=user, supabase=mock_supabase)

    with pytest.raises(RateLimitException) as exc_info:
        await limiter(user=user, supabase=mock_supabase)

    assert exc_info.value.tier_name in ("FREE", "Free")
    assert exc_info.value.service == "ai_agent"


def test_all_tiers_have_valid_limits():
    for tier, data in TIER_CONFIG.items():
        assert "name" in data
        assert "limits" in data
        limits = data["limits"]
        assert "ai_agent" in limits
        assert "weather" in limits
        assert "ticketmaster" in limits
        assert "google_maps" in limits
