from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from supabase import Client
from app.db.database import get_supabase_client as get_supabase


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    supabase: Client = Depends(get_supabase)
) -> Dict[str, Any]:
    """
    FastAPI Dependency (DI) do weryfikacji tokenu JWT przesyłanego z interceptora Axios z frontendu.
    Użycie w endpoincie: @app.get("/protected", response_model=...) async def protected_route(user: dict = Depends(get_current_user)):
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak nagłówka Authorization (Bearer token)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy format nagłówka Authorization. Oczekiwano 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.replace("Bearer ", "").strip()

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
        return user_response.user.model_dump() if hasattr(user_response.user, "model_dump") else dict(user_response.user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Błąd weryfikacji tokenu w Supabase: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
