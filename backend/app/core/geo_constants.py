"""
Centralized geographic coordinates for Polish and European cities.

This is the single source of truth for city fallback coordinates.
It is used by:
  - app/agents/lineup_agent.py (discover_festivals tool)
  - app/services/transport.py   (geocode_city fallback)

When adding new cities, add them here ONLY — never duplicate elsewhere.
Tuple format: (latitude, longitude, default_radius_km)
"""
from typing import Optional

# (lat, lng, default_search_radius_km)
CityCoord = tuple[float, float, float]

CITY_COORDS: dict[str, CityCoord] = {
    # Poland
    "warszawa": (52.2297, 21.0122, 100.0),
    "warsaw": (52.2297, 21.0122, 100.0),
    "krakow": (50.0647, 19.9450, 100.0),
    "kraków": (50.0647, 19.9450, 100.0),
    "gdynia": (54.5189, 18.5305, 120.0),
    "gdansk": (54.3520, 18.6466, 120.0),
    "gdańsk": (54.3520, 18.6466, 120.0),
    "katowice": (50.2649, 19.0238, 100.0),
    "poznan": (52.4064, 16.9252, 100.0),
    "poznań": (52.4064, 16.9252, 100.0),
    "wroclaw": (51.1079, 17.0385, 100.0),
    "wrocław": (51.1079, 17.0385, 100.0),
    "lodz": (51.7592, 19.4560, 100.0),
    "łódź": (51.7592, 19.4560, 100.0),
    "plock": (52.5463, 19.7065, 100.0),
    "płock": (52.5463, 19.7065, 100.0),
    "czaplinek": (53.5550, 16.2333, 100.0),
    # Europe
    "boom": (51.0880, 4.3667, 150.0),
    "berlin": (52.5200, 13.4050, 150.0),
    "paris": (48.8566, 2.3522, 150.0),
    "london": (51.5074, -0.1278, 150.0),
    "amsterdam": (52.3676, 4.9041, 150.0),
    "prague": (50.0755, 14.4378, 150.0),
    "vienna": (48.2082, 16.3738, 150.0),
    "budapest": (47.4979, 19.0402, 150.0),
    "barcelona": (41.3851, 2.1734, 150.0),
    # Broad regions
    "europe": (51.1657, 10.4515, 800.0),
    "pl": (51.9194, 19.1451, 400.0),
    "poland": (51.9194, 19.1451, 400.0),
    "de": (51.1657, 10.4515, 400.0),
    "germany": (51.1657, 10.4515, 400.0),
}

# Default fallback when city cannot be geocoded and is not in CITY_COORDS.
DEFAULT_COORDS: CityCoord = (52.0647, 19.2450, 250.0)  # Central Poland


def get_coords(location_type: str, location_value: str) -> CityCoord:
    """Return (lat, lng, radius_km) for a given location type and value.

    Lookup order:
    1. Exact match in CITY_COORDS by normalized location_value.
    2. 'europe' location_type shortcut.
    3. 'country' location_type shortcut (defaults to Poland).
    4. DEFAULT_COORDS fallback.
    """
    val = (location_value or "").strip().lower()
    loc_type = (location_type or "").strip().lower()

    if val in CITY_COORDS:
        return CITY_COORDS[val]

    if loc_type == "europe" or val == "europe":
        return CITY_COORDS["europe"]

    if loc_type == "country":
        return CITY_COORDS["poland"]

    return DEFAULT_COORDS
