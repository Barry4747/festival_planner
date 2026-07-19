from typing import Dict, Any, Optional
from fastapi import Depends
from supabase import Client
from app.db.database import get_supabase_client
from app.core.supabase import get_current_user
from app.repositories import FestivalRepository
from app.services import (
    FestivalAggregator,
    TicketmasterSource,
    SupabaseSource,
    FestivalSuggestionService,
    FestivalDiscoveryService,
    FestivalConciergeService,
)


def get_festival_repository(client: Client = Depends(get_supabase_client)) -> FestivalRepository:
    """FastAPI DI provider for FestivalRepository."""
    return FestivalRepository(client)


def get_suggestion_service(
    repository: FestivalRepository = Depends(get_festival_repository),
) -> FestivalSuggestionService:
    """FastAPI DI provider for FestivalSuggestionService."""
    return FestivalSuggestionService(repository)


def get_festival_aggregator() -> FestivalAggregator:
    """FastAPI DI provider for FestivalAggregator."""
    return FestivalAggregator([TicketmasterSource(), SupabaseSource()])


def get_discovery_service(
    aggregator: FestivalAggregator = Depends(get_festival_aggregator),
) -> FestivalDiscoveryService:
    """FastAPI DI provider for FestivalDiscoveryService."""
    return FestivalDiscoveryService(aggregator)


def get_authenticated_supabase_client(user: Dict[str, Any] = Depends(get_current_user)) -> Client:
    from supabase import create_client
    from app.core.config import settings
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    if "access_token" in user:
        client.postgrest.auth(user["access_token"])
    return client


def get_authenticated_festival_repository(client: Client = Depends(get_authenticated_supabase_client)) -> FestivalRepository:
    return FestivalRepository(client)


def get_concierge_service(
    repository: FestivalRepository = Depends(get_authenticated_festival_repository),
) -> FestivalConciergeService:
    """FastAPI DI provider for FestivalConciergeService."""
    return FestivalConciergeService(repository)
