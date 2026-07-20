import time
from datetime import datetime, timezone
from fastapi import Request, Depends, HTTPException
from fastapi.responses import JSONResponse
from app.core.supabase import get_current_user
from app.core.tiers import TIER_CONFIG

class RateLimitException(Exception):
    def __init__(self, tier_name: str, service: str, message: str):
        self.tier_name = tier_name
        self.service = service
        self.message = message

async def rate_limit_exception_handler(request: Request, exc: RateLimitException):
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "tier": exc.tier_name,
            "service": exc.service,
            "message": exc.message
        }
    )

# In-memory stores
_rpm_store = {}
_rpd_store = {}

def check_rate_limit(service_name: str):
    async def dependency(user: dict = Depends(get_current_user)):
        user_id = user.get("id")
        tier_key = user.get("user_metadata", {}).get("tier", "BEFOREK") if user.get("user_metadata") else "BEFOREK"
        if tier_key not in TIER_CONFIG:
            tier_key = "BEFOREK"
        
        tier_data = TIER_CONFIG[tier_key]
        limits = tier_data["limits"].get(service_name, {"rpm": 10, "rpd": 20})
        max_rpm = limits["rpm"]
        max_rpd = limits["rpd"]
        
        now = time.time()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # RPM Check
        if user_id not in _rpm_store:
            _rpm_store[user_id] = {}
        if service_name not in _rpm_store[user_id]:
            _rpm_store[user_id][service_name] = []
            
        recent_requests = [t for t in _rpm_store[user_id][service_name] if now - t < 60]
        if len(recent_requests) >= max_rpm:
            raise RateLimitException(
                tier_name=tier_data["name"],
                service=service_name,
                message=f"Minute limit reached ({max_rpm}/min)."
            )
            
        # RPD Check
        if user_id not in _rpd_store:
            _rpd_store[user_id] = {}
        if service_name not in _rpd_store[user_id]:
            _rpd_store[user_id][service_name] = {}
            
        current_rpd = _rpd_store[user_id][service_name].get(today, 0)
        if current_rpd >= max_rpd:
            raise RateLimitException(
                tier_name=tier_data["name"],
                service=service_name,
                message=f"Daily limit reached ({max_rpd}/day)."
            )
            
        # Increment usage
        recent_requests.append(now)
        _rpm_store[user_id][service_name] = recent_requests
        _rpd_store[user_id][service_name][today] = current_rpd + 1
        
        return user
        
    return dependency
