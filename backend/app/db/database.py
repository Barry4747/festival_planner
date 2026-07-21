from functools import lru_cache
import logging

from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)


@lru_cache()
def get_supabase_client() -> Client:
    """
    Returns a singleton instance of the Supabase Python client configured
    with SUPABASE_URL and SUPABASE_KEY from application settings.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in environment configuration (.env)")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


@lru_cache()
def get_service_supabase_client() -> Client:
    """
    Returns a singleton instance of the Supabase Python client configured
    with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment configuration (.env)")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def init_db() -> None:
    """Verify Supabase client initialization at application startup."""
    try:
        get_supabase_client()
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.warning("Supabase client initialization warning: %s", e)

