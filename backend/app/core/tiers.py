TIER_CONFIG = {
    "FREE": {
        "name": "Free",
        "limits": {
            "ai_agent": {"rpm": 0, "rpd": 5},
            "google_maps": {"rpm": 10, "rpd": 50},
            "ticketmaster": {"rpm": 15, "rpd": 100},
            "weather": {"rpm": 10, "rpd": 30}
        }
    },
    "BASIC": {
        "name": "Basic",
        "limits": {
            "ai_agent": {"rpm": 10, "rpd": 50},
            "google_maps": {"rpm": 30, "rpd": 150},
            "ticketmaster": {"rpm": 60, "rpd": 300},
            "weather": {"rpm": 30, "rpd": 150}
        }
    },
    "PRO": {
        "name": "Pro",
        "limits": {
            "ai_agent": {"rpm": 60, "rpd": 500},
            "google_maps": {"rpm": 100, "rpd": 1000},
            "ticketmaster": {"rpm": 120, "rpd": 1000},
            "weather": {"rpm": 100, "rpd": 1000}
        }
    }
}
