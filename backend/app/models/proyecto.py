"""Modelo Proyecto — seguimiento de proyectos de clientes"""
import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.hito import Hito
    from app.models.entregable import Entregable
    from app.models.bitacora import Bitacora
    from app.models.preview import Preview
    from app.models.mensaje import Mensaje


class Proyecto(Base):
    __tablename__ = "proyectos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cliente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    progreso: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estado: Mapped[str] = mapped_column(String(30), default="activo", nullable=False, index=True)
    staging_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    proxima_entrega: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    cliente: Mapped["Usuario"] = relationship("Usuario", back_populates="proyectos")
    hitos: Mapped[List["Hito"]] = relationship(
        "Hito", back_populates="proyecto", cascade="all, delete-orphan", order_by="Hito.orden"
    )
    entregables: Mapped[List["Entregable"]] = relationship(
        "Entregable", back_populates="proyecto", cascade="all, delete-orphan", order_by="Entregable.created_at.desc()"
    )
    bitacoras: Mapped[List["Bitacora"]] = relationship(
        "Bitacora", back_populates="proyecto", cascade="all, delete-orphan", order_by="Bitacora.created_at.desc()"
    )
    previews: Mapped[List["Preview"]] = relationship(
        "Preview", back_populates="proyecto", cascade="all, delete-orphan", order_by="Preview.orden"
    )
    mensajes: Mapped[List["Mensaje"]] = relationship(
        "Mensaje", back_populates="proyecto", cascade="all, delete-orphan"
    )
