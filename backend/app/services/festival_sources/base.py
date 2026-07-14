from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseFestivalSource(ABC):
    """Abstract Base Class for all festival data sources plugged into the FestivalAggregator."""

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Name of the data source (e.g. 'Ticketmaster', 'LocalDB')."""
        pass

    @abstractmethod
    async def search(
        self,
        lat: float,
        lng: float,
        radius_km: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for music festivals/events within radius_km of (lat, lng).
        Must return a standardized list of dictionaries containing at minimum:
        - id: str
        - name: str
        - lat: float
        - lng: float
        - start_date: str (e.g., YYYY-MM-DD or ISO format)
        - end_date: str (optional/e.g., YYYY-MM-DD or ISO format)
        - source_name: str
        """
        pass
