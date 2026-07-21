import logging
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import chat_router, planner_router, transport_router, trips_router, auth_router
from app.core.config import settings
from app.core.rate_limit import RateLimitException, rate_limit_exception_handler
from app.core.supabase import get_current_user
from app.core.tiers import TIER_CONFIG
from app.db import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="LINEUP API",
    version="0.1.0",
    lifespan=lifespan,
    # Disable the default 500 debug detail in production
    openapi_url="/openapi.json" if settings.ENVIRONMENT == "development" else None,
)

app.add_exception_handler(RateLimitException, rate_limit_exception_handler)

# CORS — origins, methods and headers are explicitly constrained.
# ALLOWED_ORIGINS is loaded from the ALLOWED_ORIGINS env variable (see config.py).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(planner_router, prefix="/api", tags=["Planner"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(transport_router, prefix="/api/transport", tags=["Transport"])
app.include_router(trips_router, prefix="/api/trips", tags=["Trips"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "LINEUP API"}


@app.get("/api/tiers", tags=["Config"])
async def get_tiers(_user: dict = Depends(get_current_user)):
    """Return public tier configuration. Requires authentication to prevent
    anonymous probing of rate limit thresholds."""
    return {
        tier: {"name": data["name"], "limits": data["limits"]}
        for tier, data in TIER_CONFIG.items()
    }


@app.get("/api/me", tags=["Auth"])
async def get_my_profile(user: dict = Depends(get_current_user)):
    """Return basic profile info for the authenticated user."""
    return {"status": "authenticated", "user": user}