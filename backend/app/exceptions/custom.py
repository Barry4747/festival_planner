"""Application custom exceptions and FastAPI exception handlers."""
from fastapi import Request
from fastapi.responses import JSONResponse


class RateLimitException(Exception):
    """Raised when a user exceeds their tier rate limits."""

    def __init__(self, tier_name: str, service: str, message: str) -> None:
        self.tier_name = tier_name
        self.service = service
        self.message = message


async def rate_limit_exception_handler(request: Request, exc: RateLimitException) -> JSONResponse:
    """FastAPI exception handler for RateLimitException."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "tier": exc.tier_name,
            "service": exc.service,
            "message": exc.message,
        },
    )


class ChatUnavailableException(Exception):
    """Raised when the AI chat service is disabled (kill-switch active)."""
    pass


async def chat_unavailable_exception_handler(request: Request, exc: ChatUnavailableException) -> JSONResponse:
    """FastAPI exception handler for ChatUnavailableException."""
    return JSONResponse(
        status_code=503,
        content={
            "error": "chat_unavailable",
            "message": "Czat z asystentem AI jest obecnie niedostępny. Wróć za jakiś czas.",
        },
    )
