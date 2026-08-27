"""Servicio del portal de clientes"""
from datetime import date
from typing import List
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import PermisosDenegadosError, RecursoNoEncontradoError
from app.utils.sanitize import sanitize_text
from app.models.hito import Hito
from app.models.mensaje import Mensaje
from app.models.notificacion import Notificacion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas import (
    DashboardResponse,
    MensajeCreate,
    MensajeResponse,
    NotificacionResponse,
    ProyectoDetail,
    ProyectoSummary,
)


class PortalService:
    async def _get_user_projects_query(self, user: Usuario):
        query = select(Proyecto).order_by(Proyecto.updated_at.desc())
        if user.rol != "admin":
            query = query.where(Proyecto.cliente_id == user.id)
        return query

    async def get_dashboard(self, db: AsyncSession, user: Usuario) -> DashboardResponse:
        query = await self._get_user_projects_query(user)
        result = await db.execute(query)
        proyectos = result.scalars().all()

        activos = [p for p in proyectos if p.estado == "activo"]
        proxima = None
        for p in activos:
            if p.proxima_entrega and (proxima is None or p.proxima_entrega < proxima):
                proxima = p.proxima_entrega

        hitos_pendientes = 0
        if activos:
            hito_result = await db.execute(
                select(func.count(Hito.id)).where(
                    Hito.proyecto_id.in_([p.id for p in activos]),
                    Hito.estado.in_(["pendiente", "en_curso"]),
                )
            )
            hitos_pendientes = hito_result.scalar() or 0

        progreso = 0
        if activos:
            progreso = round(sum(p.progreso for p in activos) / len(activos))

        return DashboardResponse(
            proyectos_activos=len(activos),
            proxima_entrega=proxima,
            tareas_pendientes=hitos_pendientes,
            progreso_general=progreso,
            proyectos=[ProyectoSummary.model_validate(p) for p in proyectos],
        )

    async def list_projects(self, db: AsyncSession, user: Usuario) -> List[ProyectoSummary]:
        query = await self._get_user_projects_query(user)
        result = await db.execute(query)
        return [ProyectoSummary.model_validate(p) for p in result.scalars().all()]

    async def get_project(self, db: AsyncSession, user: Usuario, project_id: UUID) -> ProyectoDetail:
        query = (
            select(Proyecto)
            .options(
                selectinload(Proyecto.hitos),
                selectinload(Proyecto.entregables),
                selectinload(Proyecto.bitacoras),
                selectinload(Proyecto.previews),
            )
            .where(Proyecto.id == project_id)
        )
        if user.rol != "admin":
            query = query.where(Proyecto.cliente_id == user.id)

        result = await db.execute(query)
        proyecto = result.scalar_one_or_none()
        if proyecto is None:
            raise RecursoNoEncontradoError("Proyecto no encontrado")

        return ProyectoDetail.model_validate(proyecto)

    async def list_messages(self, db: AsyncSession, user: Usuario, project_id: UUID | None = None):
        query = (
            select(Mensaje, Usuario)
            .join(Usuario, Mensaje.autor_id == Usuario.id)
            .order_by(Mensaje.created_at.desc())
        )

        if project_id:
            await self.get_project(db, user, project_id)
            query = query.where(Mensaje.proyecto_id == project_id)
        elif user.rol != "admin":
            subq = select(Proyecto.id).where(Proyecto.cliente_id == user.id)
            query = query.where(Mensaje.proyecto_id.in_(subq))

        result = await db.execute(query.limit(100))
        messages = []
        for mensaje, autor in result.all():
            messages.append(
                MensajeResponse(
                    id=mensaje.id,
                    proyecto_id=mensaje.proyecto_id,
                    autor_id=mensaje.autor_id,
                    autor_nombre=autor.nombre,
                    autor_rol=autor.rol,
                    contenido=mensaje.contenido,
                    leido_at=mensaje.leido_at,
                    created_at=mensaje.created_at,
                )
            )
        return messages

    async def create_message(self, db: AsyncSession, user: Usuario, data: MensajeCreate) -> MensajeResponse:
        await self.get_project(db, user, data.proyecto_id)

        mensaje = Mensaje(
            proyecto_id=data.proyecto_id,
            autor_id=user.id,
            contenido=sanitize_text(data.contenido),
        )
        db.add(mensaje)
        await db.flush()

        return MensajeResponse(
            id=mensaje.id,
            proyecto_id=mensaje.proyecto_id,
            autor_id=mensaje.autor_id,
            autor_nombre=user.nombre,
            autor_rol=user.rol,
            contenido=mensaje.contenido,
            leido_at=mensaje.leido_at,
            created_at=mensaje.created_at,
        )

    async def list_notifications(self, db: AsyncSession, user: Usuario) -> List[NotificacionResponse]:
        result = await db.execute(
            select(Notificacion)
            .where(Notificacion.usuario_id == user.id)
            .order_by(Notificacion.created_at.desc())
            .limit(50)
        )
        return [NotificacionResponse.model_validate(n) for n in result.scalars().all()]

    async def mark_notification_read(self, db: AsyncSession, user: Usuario, notification_id: UUID):
        result = await db.execute(
            select(Notificacion).where(
                Notificacion.id == notification_id,
                Notificacion.usuario_id == user.id,
            )
        )
        notif = result.scalar_one_or_none()
        if notif is None:
            raise RecursoNoEncontradoError("Notificacion no encontrada")
        notif.leida = True
        return NotificacionResponse.model_validate(notif)

    async def get_entregable_for_download(self, db: AsyncSession, user: Usuario, entregable_id: UUID):
        from app.models.entregable import Entregable

        result = await db.execute(select(Entregable).where(Entregable.id == entregable_id))
        entregable = result.scalar_one_or_none()
        if entregable is None:
            raise RecursoNoEncontradoError("Entregable no encontrado")

        await self.get_project(db, user, entregable.proyecto_id)
        return entregable


portal_service = PortalService()
