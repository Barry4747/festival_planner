import asyncio
import math
import logging
from typing import List, Dict, Any, Optional
from .base import BaseFestivalSource

logger = logging.getLogger(__name__)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in kilometers between two points on the earth."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class SupabaseSource(BaseFestivalSource):
    """
    Festival data source fetching proprietary / niche European music festivals
    directly from the Supabase database table `local_festivals`.
    """

    @property
    def source_name(self) -> str:
        return "LocalDB"

    def _sync_search(
        self,
        lat: float,
        lng: float,
        radius_km: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        from app.db import get_supabase_client
        from app.repositories import FestivalRepository

        client = get_supabase_client()
        repo = FestivalRepository(client)

        # Calculate bounding box using ~111 km per latitude degree
        lat_delta = radius_km / 111.0
        cos_lat = math.cos(math.radians(lat))
        # Prevent division by zero close to poles
        lng_delta = radius_km / max(111.0 * cos_lat, 10.0)

        min_lat, max_lat = lat - lat_delta, lat + lat_delta
        min_lng, max_lng = lng - lng_delta, lng + lng_delta

        rows = repo._sync_get_local_festivals_in_bounding_box(
            min_lat=min_lat,
            max_lat=max_lat,
            min_lng=min_lng,
            max_lng=max_lng,
            start_date=start_date,
            end_date=end_date,
        )

        results = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            row_lat = float(row.get("lat", 0.0))
            row_lng = float(row.get("lng", 0.0))

            # Additional precise Haversine distance check within radius_km
            dist = haversine_distance(lat, lng, row_lat, row_lng)
            if dist <= radius_km:
                start_dt = str(row.get("start_date") or "")
                end_dt = str(row.get("end_date") or start_dt)
                img_url = str(row.get("image_url") or "")
                city_str = str(row.get("city") or row.get("location") or "Europe")
                genre_str = str(row.get("genre") or row.get("category") or "Niche / Exclusive")

                results.append({
                    "id": f"local_{row.get('id')}",
                    "name": str(row.get("name") or "Proprietary European Festival"),
                    "city": city_str,
                    "genre": genre_str,
                    "category": genre_str,
                    "lat": row_lat,
                    "lng": row_lng,
                    "coordinates": {"lat": row_lat, "lng": row_lng},
                    "start_date": start_dt,
                    "end_date": end_dt,
                    "dates": start_dt,
                    "source_name": self.source_name,
                    "url": str(row.get("url") or ""),
                    "image_url": img_url,
                    "image": img_url,
                })

        return results

    async def search(
        self,
        lat: float,
        lng: float,
        radius_km: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Run synchronous Supabase table queries in a non-blocking worker thread."""
        try:
            return await asyncio.to_thread(
                self._sync_search,
                lat,
                lng,
                radius_km,
                start_date,
                end_date
            )
        except Exception as e:
            logger.error(f"❌ [SupabaseSource] Error querying local_festivals table: {e}")
            return []
