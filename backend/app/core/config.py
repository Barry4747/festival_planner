from typing import List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "LINEUP"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str

    # CORS — comma-separated list of allowed origins, e.g.:
    # ALLOWED_ORIGINS=http://localhost:5173,https://yourapp.com
    ALLOWED_ORIGINS: Union[str, List[str]] = ["http://localhost:5173"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str):
            import json
            return json.loads(v)
        return v

    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
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

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.ENVIRONMENT == "production":
            # Fail-fast for missing ALLOWED_ORIGINS in production
            if not self.ALLOWED_ORIGINS or "http://localhost:5173" in self.ALLOWED_ORIGINS:
                raise ValueError("ALLOWED_ORIGINS musi być ustawione dla środowiska produkcyjnego (i nie może to być localhost)")
            
            # Fail-fast for other critical services as per code review
            if not self.TICKETMASTER_API_KEY:
                raise ValueError("TICKETMASTER_API_KEY jest wymagane w środowisku produkcyjnym")
            
            if not self.SUPABASE_SERVICE_ROLE_KEY:
                raise ValueError("SUPABASE_SERVICE_ROLE_KEY jest wymagane w środowisku produkcyjnym")
        return self

settings = Settings()