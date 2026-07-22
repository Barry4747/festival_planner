"""Redis-backed rate limiting for API endpoints.

Features:
- Persistent across server restarts.
- Works correctly in a multi-worker setup.
- User tier is verified securely from a server-side Supabase table (`user_tiers`),
  not from user-controlled metadata.
"""
import logging
from datetime import datetime, timezone
import redis.asyncio as redis

from fastapi import Depends, Request
from fastapi.responses import JSONResponse
from supabase import Client

from app.core.config import settings
from app.core.supabase import get_current_user
from app.core.tiers import TIER_CONFIG
from app.db.database import get_supabase_client
from app.exceptions import RateLimitException

logger = logging.getLogger(__name__)

# Initialize Redis client pool
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_user_tier(user_id: str, supabase: Client) -> str:
    """Fetch user tier securely from the server-side database."""
    try:
        result = supabase.table("user_tiers").select("tier").eq("user_id", user_id).execute()
        if result.data:
            return result.data[0].get("tier", "FREE")
    except Exception as e:
        logger.error("Failed to fetch user tier for %s: %s", user_id, e)
    return "FREE"


def check_rate_limit(service_name: str):
    """FastAPI dependency factory — validates RPM and RPD limits for a named service using Redis.

    Usage:
        @router.get("/endpoint")
        async def handler(_rl: dict = Depends(check_rate_limit("ticketmaster"))):
            ...
    """
    async def dependency(
        user: dict = Depends(get_current_user),
        supabase: Client = Depends(get_supabase_client),
    ) -> dict:
        user_id = user.get("id") or user.get("sub")
        if not user_id:
            # Fallback if no user is provided, though get_current_user should prevent this.
            tier_key = "FREE"
            user_id = "anonymous"
        else:
            tier_key = await get_user_tier(user_id, supabase)

        if tier_key not in TIER_CONFIG:
            tier_key = "FREE"

        tier_data = TIER_CONFIG[tier_key]
        limits = tier_data["limits"].get(service_name, {"rpm": 10, "rpd": 20})
        max_rpm: int = limits["rpm"]
        max_rpd: int = limits["rpd"]

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        minute = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M")

        # Redis keys for counting
        rpm_key = f"rl:rpm:{user_id}:{service_name}:{minute}"
        rpd_key = f"rl:rpd:{user_id}:{service_name}:{today}"

        try:
            # Use a pipeline to atomically increment and set expiration
            async with redis_client.pipeline() as pipe:
                pipe.incr(rpm_key)
                pipe.expire(rpm_key, 60 * 2)  # expire after 2 minutes just to be safe
                
                pipe.incr(rpd_key)
                pipe.expire(rpd_key, 60 * 60 * 24 * 2)  # expire after 2 days
                
                results = await pipe.execute()
                rpm_count = results[0]
                rpd_count = results[2]

            # Check limits AFTER incrementing to avoid race conditions.
            if rpm_count > max_rpm:
                logger.warning(
                    "RPM limit hit: user=%s service=%s tier=%s limit=%d",
                    user_id, service_name, tier_key, max_rpm,
                )
                raise RateLimitException(
                    tier_name=tier_data["name"],
                    service=service_name,
                    message=f"Minute limit reached ({max_rpm}/min).",
                )

            if rpd_count > max_rpd:
                logger.warning(
                    "RPD limit hit: user=%s service=%s tier=%s limit=%d",
                    user_id, service_name, tier_key, max_rpd,
                )
                raise RateLimitException(
                    tier_name=tier_data["name"],
                    service=service_name,
                    message=f"Daily limit reached ({max_rpd}/day).",
                )
        except redis.RedisError as e:
            # Fail open if Redis is down, to avoid breaking the app completely
            logger.error("Redis error during rate limiting for user %s: %s", user_id, e)

        return user

    return dependency
