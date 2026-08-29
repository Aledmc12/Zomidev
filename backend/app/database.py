"""
ZomiDev Backend — Conexion a PostgreSQL (SQLAlchemy async)
"""
import logging
import os
import ssl
from typing import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings
from app.core.exceptions import ServicioNoDisponibleError

logger = logging.getLogger(__name__)

# asyncpg no acepta sslmode= en la URL (psycopg2 sí). Convertimos a connect_args["ssl"].
_ASYNCPG_STRIP_QUERY_KEYS = frozenset({"sslmode", "ssl"})


def _build_async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def _prepare_async_database_url(url: str) -> tuple[str, dict]:
    """Quita sslmode de la URL y lo traduce a SSL para asyncpg."""
    if not url:
        return "", {}

    parsed = urlparse(url)
    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    connect_args: dict = {}
    kept_pairs: list[tuple[str, str]] = []

    for key, value in query_pairs:
        if key in _ASYNCPG_STRIP_QUERY_KEYS:
            if value.lower() in {"require", "verify-ca", "verify-full", "prefer", "true", "1"}:
                connect_args["ssl"] = ssl.create_default_context()
            continue
        kept_pairs.append((key, value))

    if "supabase.co" in (parsed.hostname or "") and "ssl" not in connect_args:
        connect_args["ssl"] = ssl.create_default_context()

    clean_query = urlencode(kept_pairs)
    clean_url = urlunparse(parsed._replace(query=clean_query))
    return _build_async_url(clean_url), connect_args


ASYNC_DATABASE_URL, _async_connect_args = _prepare_async_database_url(settings.DATABASE_URL)

_engine_kwargs = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True,
}
if _async_connect_args:
    _engine_kwargs["connect_args"] = _async_connect_args
if os.environ.get("TESTING") == "1":
    _engine_kwargs["poolclass"] = NullPool
else:
    _engine_kwargs.update(pool_size=10, max_overflow=20, pool_recycle=3600)

engine = create_async_engine(ASYNC_DATABASE_URL, **_engine_kwargs) if ASYNC_DATABASE_URL else None

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
) if engine else None


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if AsyncSessionLocal is None:
        raise ServicioNoDisponibleError(
            "Base de datos no configurada. Configura DATABASE_URL en .env."
        )

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.error(f"Error en sesion DB, rollback ejecutado: {exc}")
            raise
        finally:
            await session.close()
