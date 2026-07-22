import json
import logging
from typing import List, Optional, Union

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


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
            return json.loads(v)
        return v

    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DATABASE_URL: str
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    REDIS_URL: str = "redis://localhost:6379"
    
    @property
    def ai_chat_enabled(self) -> bool:
        return bool(self.GEMINI_API_KEY)

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
        critical_fields = [
            "TICKETMASTER_API_KEY",
            "OPENWEATHER_API_KEY",
            "GOOGLE_MAPS_API_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
        ]
        
        missing = []
        for field in critical_fields:
            if not getattr(self, field):
                missing.append(field)
                
        has_invalid_origins = not self.ALLOWED_ORIGINS or "http://localhost:5173" in self.ALLOWED_ORIGINS

        if self.ENVIRONMENT == "production":
            if has_invalid_origins:
                missing.append("ALLOWED_ORIGINS (musi być produkcyjną domeną, bez localhost)")
            
            if missing:
                raise ValueError(
                    f"Brak krytycznych zmiennych konfiguracyjnych w środowisku produkcyjnym! "
                    f"Aplikacja nie wystartuje. Uzupełnij: {', '.join(missing)}"
                )
        else:
            # Nie-produkcyjne środowiska: logujemy warning zamiast rzucać wyjątek
            if missing:
                logger.warning(
                    f"Ostrzeżenie (dev): Brak kluczy API, część funkcji Agenta zwróci błędy: {', '.join(missing)}"
                )
        
        return self

settings = Settings()