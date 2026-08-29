"""
ZomiDev Backend — Conexion a PostgreSQL (SQLAlchemy async)
"""
import logging
import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings
from app.core.exceptions import ServicioNoDisponibleError
from app.db_url import prepare_database_urls

logger = logging.getLogger(__name__)

_prepared = prepare_database_urls(settings.DATABASE_URL)
ASYNC_DATABASE_URL = _prepared.async_url
_async_connect_args = _prepared.async_connect_args

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
