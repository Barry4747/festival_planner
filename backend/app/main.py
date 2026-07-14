from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.supabase import get_current_user
from app.api.routers import planner_router
from app.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Festival Planner API",
    version="0.1.0",
    lifespan=lifespan,
)

# Konfiguracja CORS pod frontend (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(planner_router, prefix="/api", tags=["Planner"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Festival Planner API running via uv"}


@app.get("/api/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    """
    Przykładowy chroniony endpoint wywołujący DI get_current_user.
    Wymaga Bearer tokenu Supabase w nagłówku Authorization.
    """
    return {"status": "authenticated", "user": user}