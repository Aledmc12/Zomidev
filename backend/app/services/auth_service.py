"""Servicio de autenticacion"""
import secrets
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import CredencialesInvalidasError, RecursoNoEncontradoError
from app.core.security import (
    constant_time_verify,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
)
from app.models.usuario import Usuario
from app.schemas import AuthTokens, LoginRequest, UsuarioResponse
from app.utils.password import validate_password
from app.utils.redis_client import (
    consume_password_reset_token,
    is_refresh_token_valid,
    revoke_refresh_token,
    store_password_reset_token,
    store_refresh_token,
)


class AuthService:
    def _refresh_ttl(self) -> int:
        return settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600

    async def login(self, db: AsyncSession, data: LoginRequest) -> AuthTokens:
        result = await db.execute(select(Usuario).where(Usuario.email == data.email.lower()))
        user = result.scalar_one_or_none()

        if user is None or not constant_time_verify(data.password, user.hashed_password if user else None):
            raise CredencialesInvalidasError()

        if not user.activo:
            raise CredencialesInvalidasError("Cuenta desactivada")

        access_token = create_access_token(user.id, extra_claims={"rol": user.rol})
        refresh_token, jti = create_refresh_token(user.id)
        await store_refresh_token(jti, str(user.id), self._refresh_ttl())

        return AuthTokens(
            user=UsuarioResponse.model_validate(user),
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh(self, db: AsyncSession, refresh_token: str) -> tuple[str, str, str]:
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise CredencialesInvalidasError("Refresh token invalido")

        jti = payload.get("jti")
        if not jti or not await is_refresh_token_valid(jti):
            raise CredencialesInvalidasError("Refresh token revocado o expirado")

        user_id = payload.get("sub")
        result = await db.execute(select(Usuario).where(Usuario.id == UUID(user_id)))
        user = result.scalar_one_or_none()
        if user is None or not user.activo:
            raise CredencialesInvalidasError()

        await revoke_refresh_token(jti)
        new_access = create_access_token(user.id, extra_claims={"rol": user.rol})
        new_refresh, new_jti = create_refresh_token(user.id)
        await store_refresh_token(new_jti, str(user.id), self._refresh_ttl())

        return new_access, new_refresh, user.rol

    async def logout(self, refresh_token: str | None) -> None:
        if not refresh_token:
            return
        payload = decode_token(refresh_token)
        if payload and payload.get("jti"):
            await revoke_refresh_token(payload["jti"])

    async def create_user(
        self,
        db: AsyncSession,
        email: str,
        password: str,
        nombre: str,
        empresa: str | None = None,
        rol: str = "client",
    ) -> Usuario:
        validate_password(password, for_admin=(rol == "admin"))
        result = await db.execute(select(Usuario).where(Usuario.email == email.lower()))
        if result.scalar_one_or_none():
            raise CredencialesInvalidasError("El email ya esta registrado")

        user = Usuario(
            email=email.lower(),
            nombre=nombre,
            empresa=empresa,
            hashed_password=hash_password(password),
            rol=rol,
        )
        db.add(user)
        await db.flush()
        return user

    async def request_password_reset(self, db: AsyncSession, email: str) -> str | None:
        result = await db.execute(select(Usuario).where(Usuario.email == email.lower()))
        user = result.scalar_one_or_none()
        if user is None or not user.activo:
            return None

        token = secrets.token_urlsafe(32)
        await store_password_reset_token(token, str(user.id), settings.PASSWORD_RESET_EXPIRE_MINUTES * 60)
        return token

    async def reset_password(self, db: AsyncSession, token: str, new_password: str) -> None:
        user_id = await consume_password_reset_token(token)
        if not user_id:
            raise CredencialesInvalidasError("Token de recuperacion invalido o expirado")

        result = await db.execute(select(Usuario).where(Usuario.id == UUID(user_id)))
        user = result.scalar_one_or_none()
        if user is None:
            raise RecursoNoEncontradoError("Usuario no encontrado")

        validate_password(new_password, for_admin=(user.rol == "admin"))
        user.hashed_password = hash_password(new_password)


auth_service = AuthService()
