import asyncio
from datetime import datetime
import logging
import math
from typing import Any, Dict, List, Optional

from thefuzz import fuzz

from app.services.festival_sources import SupabaseSource, TicketmasterSource
from app.services.festival_sources.base import BaseFestivalSource

logger = logging.getLogger(__name__)


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two geographical coordinates
    using the standard Haversine formula.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _parse_date(date_str: Any) -> Optional[datetime]:
    """Helper to safely parse flexible date strings into datetime objects."""
    if not date_str:
        return None
    s = str(date_str).strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S"):
        try:
            cleaned = s.split("+")[0].split(".")[0].rstrip("Z")
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    try:
        if len(s) >= 10:
            return datetime.strptime(s[:10], "%Y-%m-%d")
    except ValueError:
        pass
    return None


class FestivalAggregator:
    """Central aggregator that queries multiple plugged-in festival data sources concurrently."""

    def __init__(self, sources: Optional[List[BaseFestivalSource]] = None):
        if sources is None:
            sources = [TicketmasterSource(), SupabaseSource()]
        self.sources = sources

    def _deduplicate_festivals(self, raw_festivals: List[dict]) -> List[dict]:
        """
        Intelligently deduplicates events based on Time (<= 3 days), Space (< 15 km),
        and Name similarity (> 80 token_set_ratio).
        """
        unique_festivals: List[dict] = []

        for festival in raw_festivals:
            if not isinstance(festival, dict):
                continue

            is_duplicate = False

            for unique in unique_festivals:
                # 1. Time check: start dates within 3 days of each other
                date1 = _parse_date(festival.get("start_date"))
                date2 = _parse_date(unique.get("start_date"))
                if date1 and date2:
                    time_match = abs((date1 - date2).total_seconds()) <= 3 * 86400
                elif festival.get("start_date") and unique.get("start_date") and str(festival.get("start_date")).strip() == str(unique.get("start_date")).strip():
                    time_match = True
                else:
                    time_match = (not festival.get("start_date") and not unique.get("start_date"))

                if not time_match:
                    continue

                # 2. Space check: Haversine distance < 15 km
                lat1, lon1 = festival.get("lat"), festival.get("lng")
                lat2, lon2 = unique.get("lat"), unique.get("lng")
                if lat1 is not None and lon1 is not None and lat2 is not None and lon2 is not None:
                    try:
                        dist_km = calculate_distance(float(lat1), float(lon1), float(lat2), float(lon2))
                        space_match = dist_km < 15.0
                    except (TypeError, ValueError):
                        space_match = False
                else:
                    space_match = False

                if not space_match:
                    continue

                # 3. Name check: token_set_ratio > 80
                name1 = str(festival.get("name") or "").strip()
                name2 = str(unique.get("name") or "").strip()
                if name1 and name2:
                    score = fuzz.token_set_ratio(name1, name2)
                    name_match = score > 80
                else:
                    name_match = False

                if time_match and space_match and name_match:
                    is_duplicate = True
                    # Append source information and url to existing unique event
                    if "sources" not in unique:
                        unique["sources"] = [{
                            "source_name": unique.get("source_name") or "Unknown",
                            "url": unique.get("url") or ""
                        }]
                    unique["sources"].append({
                        "source_name": festival.get("source_name") or "Unknown",
                        "url": festival.get("url") or ""
                    })

                    # Preserve URL or image if unique event lacked them
                    if not unique.get("url") and festival.get("url"):
                        unique["url"] = festival.get("url")
                    if not unique.get("image_url") and festival.get("image_url"):
                        unique["image_url"] = festival.get("image_url")
                        unique["image"] = festival.get("image_url")

                    logger.debug(f"🔄 [FestivalAggregator] Deduplicated '{name1}' ({festival.get('source_name')}) against '{name2}' ({unique.get('source_name')}) [dist={dist_km:.1f}km, score={score}]")
                    break

            if not is_duplicate:
                if "sources" not in festival:
                    festival["sources"] = [{
                        "source_name": festival.get("source_name") or "Unknown",
                        "url": festival.get("url") or ""
                    }]
                unique_festivals.append(festival)

        return unique_festivals

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
        merges results, deduplicates intelligently, and sorts chronologically.
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

        raw_festivals: List[Dict[str, Any]] = []

        for source, res in zip(self.sources, results):
            if isinstance(res, Exception):
                logger.error(f"❌ [FestivalAggregator] Source '{source.source_name}' raised exception: {res}")
                continue
            if not isinstance(res, list):
                continue

            for fest in res:
                if isinstance(fest, dict):
                    raw_festivals.append(fest)

        deduplicated = self._deduplicate_festivals(raw_festivals)

        # Sort combined items chronologically if start_date is present
        deduplicated.sort(key=lambda x: str(x.get("start_date") or "9999"))

        logger.info(f"✅ [FestivalAggregator] Aggregated {len(raw_festivals)} raw events down to {len(deduplicated)} unique festivals.")
        return deduplicated
