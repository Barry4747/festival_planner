import logging
from typing import List, Dict, Any, Optional
from app.api.external.events import TicketmasterClient
from .base import BaseFestivalSource

logger = logging.getLogger(__name__)


class TicketmasterSource(BaseFestivalSource):
    """Concrete source wrapping Ticketmaster Discovery API."""

    @property
    def source_name(self) -> str:
        return "Ticketmaster"

    async def search(
        self,
        lat: float,
        lng: float,
        radius_km: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        logger.info(f"🔎 [TicketmasterSource] Searching around ({lat}, {lng}) radius={radius_km}km")
        try:
            response = await TicketmasterClient.search_events(
                keyword="festival",
                segment_id="KZFzniwnSyZfZ7v7nJ",
                latlong=f"{lat},{lng}",
                radius=radius_km,
                unit="km",
                start_date_time=start_date,
                end_date_time=end_date,
                size=50
            )
            events = response.get("_embedded", {}).get("events", []) if isinstance(response, dict) else []
            standardized = []
            seen_ids = set()

            for ev in events:
                if not isinstance(ev, dict):
                    continue
                ev_id = str(ev.get("id") or "")
                if not ev_id or ev_id in seen_ids:
                    continue

                name = ev.get("name") or "Music Festival"

                venues = ev.get("_embedded", {}).get("venues", [])
                lat_val, lng_val = None, None
                if venues and isinstance(venues, list) and len(venues) > 0:
                    loc = venues[0].get("location", {})
                    if loc:
                        try:
                            lat_val = float(loc.get("latitude"))
                            lng_val = float(loc.get("longitude"))
                        except (TypeError, ValueError):
                            pass

                if lat_val is None or lng_val is None:
                    continue

                seen_ids.add(ev_id)

                dates_obj = ev.get("dates", {}).get("start", {})
                start_date_str = str(dates_obj.get("localDate") or dates_obj.get("dateTime") or "")
                end_obj = ev.get("dates", {}).get("end", {})
                end_date_str = str(end_obj.get("localDate") or end_obj.get("dateTime") or start_date_str)

                images = ev.get("images", [])
                img_url = ""
                if isinstance(images, list) and len(images) > 0:
                    sorted_images = sorted(
                        [img for img in images if isinstance(img, dict)],
                        key=lambda x: x.get("width", 0),
                        reverse=True
                    )
                    img_url = sorted_images[0].get("url", "") if sorted_images else ""

                standardized.append({
                    "id": ev_id,
                    "name": name,
                    "lat": lat_val,
                    "lng": lng_val,
                    "coordinates": {"lat": lat_val, "lng": lng_val},
                    "start_date": start_date_str,
                    "end_date": end_date_str,
                    "dates": start_date_str,
                    "source_name": self.source_name,
                    "url": ev.get("url") or "",
                    "image_url": img_url,
                    "image": img_url,
                })
            return standardized
        except Exception as e:
            logger.error(f"❌ [TicketmasterSource] Error fetching events: {e}")
            return []
