import asyncio
import logging
from typing import List, Dict, Any, Optional
from app.services.festival_sources.base import BaseFestivalSource

logger = logging.getLogger(__name__)


class FestivalAggregator:
    """Central aggregator that queries multiple plugged-in festival data sources concurrently."""

    def __init__(self, sources: Optional[List[BaseFestivalSource]] = None):
        if sources is None:
            from app.services.festival_sources import TicketmasterSource, SupabaseSource
            sources = [TicketmasterSource(), SupabaseSource()]
        self.sources = sources

    async def aggregate_festivals(
        self,
        lat: float,
        lng: float,
        radius_km: float = 50.0,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Concurrently queries all registered festival sources using asyncio.gather,
        merges results, deduplicates by exact (normalized_name, start_date), and sorts chronologically.
        """
        if not self.sources:
            logger.warning("⚠️ [FestivalAggregator] No sources plugged into aggregator.")
            return []

        logger.info(f"🌐 [FestivalAggregator] Aggregating across {len(self.sources)} sources: {[s.source_name for s in self.sources]}")

        tasks = [
            source.search(
                lat=lat,
                lng=lng,
                radius_km=radius_km,
                start_date=start_date,
                end_date=end_date
            )
            for source in self.sources
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        unified_list: List[Dict[str, Any]] = []
        seen_keys = set()

        for source, res in zip(self.sources, results):
            if isinstance(res, Exception):
                logger.error(f"❌ [FestivalAggregator] Source '{source.source_name}' raised exception: {res}")
                continue
            if not isinstance(res, list):
                continue

            for fest in res:
                if not isinstance(fest, dict):
                    continue

                name = (fest.get("name") or "").strip().lower()
                start = (fest.get("start_date") or "").strip()
                # Deduplication key based on normalized name and start_date
                dedup_key = (name, start)

                if dedup_key in seen_keys and name != "":
                    logger.debug(f"🔄 [FestivalAggregator] Deduplicated exact match: {fest.get('name')} on {start}")
                    continue

                seen_keys.add(dedup_key)
                unified_list.append(fest)

        # Sort combined items chronologically if start_date is present
        unified_list.sort(key=lambda x: str(x.get("start_date") or "9999"))

        logger.info(f"✅ [FestivalAggregator] Aggregated {len(unified_list)} unique festivals across sources.")
        return unified_list
