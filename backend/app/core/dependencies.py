"""
ZomiDev Backend — Dependencies FastAPI
"""
from typing import Optional
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import CredencialesInvalidasError, PermisosDenegadosError, TokenExpiradoError
from app.core.security import decode_token
from app.database import get_db

security_scheme = HTTPBearer(auto_error=False)

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
ROLE_COOKIE = "zomidev_role"


def _extract_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials],
) -> Optional[str]:
    if credentials and credentials.credentials:
        return credentials.credentials
    return request.cookies.get(ACCESS_COOKIE)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    from app.models.usuario import Usuario

    token = _extract_token(request, credentials)
    if not token:
        raise CredencialesInvalidasError("Token de autenticacion requerido")

    payload = decode_token(token)
    if payload is None:
        raise TokenExpiradoError()

    if payload.get("type") != "access":
        raise CredencialesInvalidasError("Tipo de token incorrecto")

    user_id = payload.get("sub")
    if not user_id:
        raise CredencialesInvalidasError()

    result = await db.execute(select(Usuario).where(Usuario.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise CredencialesInvalidasError("Usuario no encontrado")

    if not user.activo:
        raise PermisosDenegadosError("Cuenta desactivada")

    return user


async def get_current_admin(current_user=Depends(get_current_user)):
    if current_user.rol != "admin":
        raise PermisosDenegadosError("Se requiere rol de administrador")
    return current_user


async def get_current_client(current_user=Depends(get_current_user)):
    if current_user.rol not in ("client", "admin"):
        raise PermisosDenegadosError("Acceso restringido al portal de clientes")
    return current_user
