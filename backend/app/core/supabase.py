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

    # 1. Priorytetowo sprawdzamy nagłówek Authorization: Bearer <token>
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()

    # 2. Fallback: Jeśli brak nagłówka, sprawdzamy ciasteczka (np. sb-festival-planner-auth-token z frontendu)
    if not token and request.cookies:
        cookie_key = "sb-festival-planner-auth-token"
        raw_val = request.cookies.get(cookie_key)
        
        # Jeśli ciasteczko jest podzielone na chunki (cookie_key.0, cookie_key.1)
        if not raw_val:
            chunk_idx = 0
            chunks = []
            while True:
                c = request.cookies.get(f"{cookie_key}.{chunk_idx}")
                if not c:
                    break
                chunks.append(c)
                chunk_idx += 1
            if chunks:
                raw_val = "".join(chunks)

        if raw_val:
            try:
                decoded_json = urllib.parse.unquote(raw_val)
                parsed = json.loads(decoded_json)
                if isinstance(parsed, dict) and "access_token" in parsed:
                    token = parsed["access_token"]
                elif isinstance(parsed, str):
                    token = parsed
            except Exception:
                # Jeśli raw_val nie jest JSONem, traktujemy jako czysty token lub ignorujemy
                if len(raw_val) > 20:
                    token = urllib.parse.unquote(raw_val)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak nagłówka Authorization oraz aktywnych ciasteczek sesyjnych (Bearer token lub Cookie)",
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
