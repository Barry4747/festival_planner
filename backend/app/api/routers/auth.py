from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from app.services.auth_service import AuthService
from app.dependencies import get_auth_service
from app.schemas.auth import EmailPasswordRequest
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, max_age: int = 31536000):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=max_age,
        path="/"
    )
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=max_age,
            path="/"
        )

def _clear_auth_cookies(response: Response):
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=0,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value="",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=0,
        path="/"
    )

@router.post("/signup")
async def signup(request: EmailPasswordRequest, service: AuthService = Depends(get_auth_service)):
    try:
        res = await service.signup_with_password(request.email, request.password)
        return {"success": True, "user": res.get("user")}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login")
async def login(request: EmailPasswordRequest, response: Response, service: AuthService = Depends(get_auth_service)):
    try:
        res = await service.login_with_password(request.email, request.password)
        _set_auth_cookies(response, res["access_token"], res.get("refresh_token"))
        return {"success": True, "user": res.get("user")}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

@router.post("/logout")
async def logout(response: Response):
    _clear_auth_cookies(response)
    return {"success": True}

@router.get("/google")
async def google_login(redirect_to: str, service: AuthService = Depends(get_auth_service)):
    try:
        url = await service.get_oauth_url("google", redirect_to=redirect_to)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate OAuth URL")

@router.get("/callback")
async def auth_callback(code: str, next: str = "/discover", service: AuthService = Depends(get_auth_service)):
    """Callback route for OAuth flow"""
    try:
        res = await service.exchange_code_for_session(code)
        
        response = RedirectResponse(url=next)
        _set_auth_cookies(response, res["access_token"], res.get("refresh_token"))
        return response
    except Exception as e:
        logger.error(f"Callback error: {e}")
        # redirect to login with error
        return RedirectResponse(url="/login?error=auth_failed")
