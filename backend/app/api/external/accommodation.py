import logging
from typing import Optional, Any, Dict
import httpx
from app.core.config import settings

logger = logging.getLogger("festival_planner.external.accommodation")


class BookingClient:
    """
    Klient do wyszukiwania noclegów (Booking.com Affiliate API lub scrapowane dane).
    """
    @classmethod
    async def search_hotels(
        cls,
        destination: str,
        check_in: str,
        check_out: str,
        guests: int = 2,
        max_price: Optional[float] = None
    ) -> Dict[str, Any]:
        if not settings.BOOKING_API_KEY:
            logger.warning("Brak klucza BOOKING_API_KEY w konfiguracji.")
            return {"error": "API key not configured for Booking.com"}

        url = "https://api.booking.com/v1/hotels/search"
        headers = {"Authorization": f"Bearer {settings.BOOKING_API_KEY}"}
        params: Dict[str, Any] = {
            "city": destination,
            "checkin_date": check_in,
            "checkout_date": check_out,
            "adults": guests
        }
        if max_price:
            params["price_max"] = max_price

        async with httpx.AsyncClient(timeout=12.0) as client:
            try:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error("Booking API HTTP status error: status=%s, url=%s, body=%s", e.response.status_code, url, e.response.text[:200])
                return {"error": "Nie udało się pobrać danych o hotelach, spróbuj ponownie."}
            except httpx.RequestError as e:
                logger.error("Booking API network error for %s: %s", url, e)
                return {"error": "Nie udało się połączyć z serwisem Booking.com, spróbuj ponownie."}
