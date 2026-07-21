from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Festival Planner"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str

    # CORS — comma-separated list of allowed origins, e.g.:
    # ALLOWED_ORIGINS=http://localhost:5173,https://yourapp.com
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]

    SUPABASE_URL: str
    SUPABASE_KEY: str
    DATABASE_URL: str
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    REDIS_URL: str = "redis://localhost:6379"

    # Weather API
    OPENWEATHER_API_KEY: Optional[str] = None
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1/forecast"
    
    # Events & Lineup APIs
    TICKETMASTER_API_KEY: Optional[str] = None
    SONGKICK_API_KEY: Optional[str] = None
    
    # Polish Transport APIs
    PKP_PLK_API_URL: str = "https://pdp-api.plk-sa.pl"
    POLAND_TRANSPORT_URL: str = "https://poland.transport.rest"
    
    # Maps & Routing
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    
    # Accommodation
    BOOKING_AFFILIATE_ID: Optional[str] = None
    BOOKING_API_KEY: Optional[str] = None
    
    # Calendar Integration
    GOOGLE_CALENDAR_CLIENT_ID: Optional[str] = None
    GOOGLE_CALENDAR_CLIENT_SECRET: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()