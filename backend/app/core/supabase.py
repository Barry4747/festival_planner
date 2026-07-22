from typing import Optional, Dict, Any
import json
import logging
import urllib.parse
from fastapi import Header, HTTPException, status, Depends, Request
from supabase import Client
from app.db.database import get_supabase_client as get_supabase

logger = logging.getLogger(__name__)


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    supabase: Client = Depends(get_supabase)
) -> Dict[str, Any]:
    """
    FastAPI Dependency (DI) do weryfikacji tokenu JWT przesyłanego z interceptora Axios z frontendu
    lub bezpośrednio z profesjonalnych ciasteczek sesyjnych (Cookie Storage).
    Użycie w endpoincie: @app.get("/protected", response_model=...) async def protected_route(user: dict = Depends(get_current_user)):
    """
    token = None

    # 1. Sprawdzamy czyste ciastko HttpOnly
    if request.cookies:
        token = request.cookies.get("access_token")
    
    # 2. Priorytetowo sprawdzamy nagłówek Authorization: Bearer <token> (np. przy testowaniu API z cURL)
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak nagłówka Authorization oraz aktywnych ciasteczek sesyjnych (HttpOnly)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Weryfikacja tokenu w Supabase Auth
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy lub wygasły token sesji",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Bezpiecznie zwracamy dane użytkownika w formie słownika/modelu
        user_dict = user_response.user.model_dump() if hasattr(user_response.user, "model_dump") else dict(user_response.user)
        user_dict["access_token"] = token
        return user_dict
    except HTTPException:
        raise
    except Exception as e:
        # Log the real error internally; never expose internal details to the client.
        logger.error("Token verification error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
