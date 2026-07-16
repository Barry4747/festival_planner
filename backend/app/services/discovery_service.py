import logging
from typing import List, Dict, Any, Optional
from app.services.aggregator import FestivalAggregator

logger = logging.getLogger(__name__)


class FestivalDiscoveryService:
    """Service encapsulating map-based event discovery and data aggregation."""

    def __init__(self, aggregator: FestivalAggregator):
        self.aggregator = aggregator

    async def discover_festivals_map(
        self,
        lat: float,
        lng: float,
        radius_km: float = 50.0,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Query multiple data sources via aggregator and return unified festival list."""
        try:
            return await self.aggregator.aggregate_festivals(
                lat=lat,
                lng=lng,
                radius_km=float(radius_km),
                start_date=start_date,
                end_date=end_date,
            )
        except Exception as e:
            logger.error(f"❌ [FestivalDiscoveryService] Error aggregating festivals: {e}")
            return []
