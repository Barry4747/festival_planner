import logging
from typing import Dict, Any, Optional
from supabase import Client

logger = logging.getLogger(__name__)

class AuthService:
    """Service to handle authentication via Supabase Auth and manage sessions."""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def login_with_password(self, email: str, password: str) -> Dict[str, Any]:
        """Logs in a user with email and password."""
        try:
            response = self.supabase.auth.sign_in_with_password({"email": email, "password": password})
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "expires_in": response.session.expires_in,
                "user": response.user.model_dump() if hasattr(response.user, "model_dump") else dict(response.user)
            }
        except Exception as e:
            logger.error(f"Login failed: {e}")
            raise

    async def signup_with_password(self, email: str, password: str) -> Dict[str, Any]:
        """Signs up a new user."""
        try:
            response = self.supabase.auth.sign_up({"email": email, "password": password})
            return {
                "user": response.user.model_dump() if hasattr(response.user, "model_dump") else dict(response.user)
            }
        except Exception as e:
            logger.error(f"Signup failed: {e}")
            raise

    async def get_oauth_url(self, provider: str, redirect_to: str) -> str:
        """Returns the OAuth URL for the given provider."""
        try:
            # supabase-py currently returns the OAuth URL response in data.url
            response = self.supabase.auth.sign_in_with_oauth(
                {
                    "provider": provider,
                    "options": {
                        "redirect_to": redirect_to
                    }
                }
            )
            return response.url
        except Exception as e:
            logger.error(f"Failed to generate OAuth URL: {e}")
            raise

    async def exchange_code_for_session(self, code: str) -> Dict[str, Any]:
        """Exchanges an OAuth code for a session."""
        try:
            response = self.supabase.auth.exchange_code_for_session({"auth_code": code})
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "expires_in": response.session.expires_in,
                "user": response.user.model_dump() if hasattr(response.user, "model_dump") else dict(response.user)
            }
        except Exception as e:
            logger.error(f"Code exchange failed: {e}")
            raise
