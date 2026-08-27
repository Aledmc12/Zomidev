"""Auth endpoints"""
from typing import Optional

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    ROLE_COOKIE,
    get_current_user,
)
from app.core.exceptions import PermisosDenegadosError
from app.database import get_db
from app.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    RefreshResponse,
    ResetPasswordRequest,
    UsuarioResponse,
)
from app.services.auth_service import auth_service
from app.services.email_service import email_service
from app.utils.redis_client import check_rate_limit
from app.utils.request import get_client_ip

router = APIRouter(prefix="/auth", tags=["Auth"])


def _cookie_params(max_age: int) -> dict:
    return {
        "httponly": True,
        "secure": settings.is_production,
        "samesite": "lax",
        "max_age": max_age,
        "path": "/",
    }


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, rol: str) -> None:
    response.set_cookie(key=ACCESS_COOKIE, value=access_token, **_cookie_params(settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60))
    response.set_cookie(key=REFRESH_COOKIE, value=refresh_token, **_cookie_params(settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400))
    response.set_cookie(key=ROLE_COOKIE, value=rol, **_cookie_params(settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400))


def _clear_auth_cookies(response: Response) -> None:
    for key in (ACCESS_COOKIE, REFRESH_COOKIE, ROLE_COOKIE):
        response.delete_cookie(key, path="/")


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    client_ip = get_client_ip(request)
    permitido, _ = await check_rate_limit(
        f"{client_ip}:{data.email.lower()}",
        limit=10,
        window_seconds=900,
        prefix="rl:login",
        fail_closed=True,
    )
    if not permitido:
        raise PermisosDenegadosError("Demasiados intentos. Espera 15 minutos.")

    permitido_email, _ = await check_rate_limit(
        data.email.lower(),
        limit=20,
        window_seconds=3600,
        prefix="rl:login:email",
        fail_closed=True,
    )
    if not permitido_email:
        raise PermisosDenegadosError("Demasiados intentos para esta cuenta. Espera 1 hora.")

    login_data = await auth_service.login(db, data)
    _set_auth_cookies(response, login_data.access_token, login_data.refresh_token, login_data.user.rol)
    return LoginResponse(user=login_data.user)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    if not refresh_token:
        raise PermisosDenegadosError("Sesion expirada")

    access_token, new_refresh, rol = await auth_service.refresh(db, refresh_token)
    _set_auth_cookies(response, access_token, new_refresh, rol)
    return RefreshResponse()


@router.get("/me", response_model=UsuarioResponse)
async def me(current_user=Depends(get_current_user)):
    return UsuarioResponse.model_validate(current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response):
    await auth_service.logout(request.cookies.get(REFRESH_COOKIE))
    _clear_auth_cookies(response)
    return None


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    client_ip = get_client_ip(request)
    permitido, _ = await check_rate_limit(
        f"reset:{client_ip}",
        limit=5,
        window_seconds=3600,
        prefix="rl",
        fail_closed=True,
    )
    if not permitido:
        raise PermisosDenegadosError("Demasiadas solicitudes. Intenta mas tarde.")

    token = await auth_service.request_password_reset(db, data.email)
    if token:
        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/recuperar-contrasena?token={token}"
        await email_service.enviar_reset_password(data.email, reset_url)
    return ForgotPasswordResponse(
        ok=True,
        message="Si el email existe, recibiras instrucciones para restablecer tu contrasena.",
    )


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.reset_password(db, data.token, data.password)
    return None
