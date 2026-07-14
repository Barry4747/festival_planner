from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    Returns a singleton instance of the Supabase Python client configured
    with SUPABASE_URL and SUPABASE_KEY from application settings.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in environment configuration (.env)")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def init_db():
    """Verify Supabase client initialization at application startup."""
    try:
        get_supabase_client()
        print("⚡ [SUPABASE DB] Initialized Supabase client successfully.")
    except Exception as e:
        print(f"⚠️ [SUPABASE DB] Warning during Supabase client initialization: {e}")
