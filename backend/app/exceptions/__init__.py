"""Package marker and exports for app exceptions."""
from .custom import (
    RateLimitException,
    rate_limit_exception_handler,
    ChatUnavailableException,
    chat_unavailable_exception_handler,
)

__all__ = [
    "RateLimitException",
    "rate_limit_exception_handler",
    "ChatUnavailableException",
    "chat_unavailable_exception_handler",
]
