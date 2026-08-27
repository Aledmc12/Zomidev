"""Servicio admin — gestion de proyectos y clientes"""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import RecursoNoEncontradoError
from app.models.bitacora import Bitacora
from app.models.entregable import Entregable
from app.models.hito import Hito
from app.models.mensaje import Mensaje
from app.models.notificacion import Notificacion
from app.models.preview import Preview
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas import ProyectoDetail, ProyectoSummary, UsuarioResponse
from app.schemas.admin import (
    AdminBitacoraCreate,
    AdminEntregableCreate,
    AdminHitoCreate,
    AdminHitoUpdate,
    AdminPreviewCreate,
    AdminProyectoCreate,
    AdminProyectoUpdate,
    AdminStatsResponse,
    AdminUsuarioCreate,
    AdminUsuarioResponse,
)
from app.services.auth_service import auth_service
from app.services.file_service import validate_archivo_url
from app.utils.sanitize import sanitize_text


class AdminService:
    async def get_stats(self, db: AsyncSession) -> AdminStatsResponse:
        clientes = await db.scalar(select(func.count(Usuario.id)).where(Usuario.rol == "client"))
        proyectos = await db.scalar(select(func.count(Proyecto.id)))
        activos = await db.scalar(select(func.count(Proyecto.id)).where(Proyecto.estado == "activo"))
        sin_leer = await db.scalar(select(func.count(Mensaje.id)).where(Mensaje.leido_at.is_(None)))

        return AdminStatsResponse(
            total_clientes=clientes or 0,
            total_proyectos=proyectos or 0,
            proyectos_activos=activos or 0,
            mensajes_sin_leer=sin_leer or 0,
        )

    async def list_clients(self, db: AsyncSession):
        result = await db.execute(select(Usuario).where(Usuario.rol == "client").order_by(Usuario.nombre))
        return [AdminUsuarioResponse.model_validate(u) for u in result.scalars().all()]

    async def create_client(self, db: AsyncSession, data: AdminUsuarioCreate):
        user = await auth_service.create_user(
            db,
            email=data.email,
            password=data.password,
            nombre=data.nombre,
            empresa=data.empresa,
            rol=data.rol,
        )
        return AdminUsuarioResponse.model_validate(user)

    async def list_projects(self, db: AsyncSession):
        result = await db.execute(select(Proyecto).order_by(Proyecto.updated_at.desc()))
        return [ProyectoSummary.model_validate(p) for p in result.scalars().all()]

    async def create_project(self, db: AsyncSession, data: AdminProyectoCreate):
        result = await db.execute(select(Usuario).where(Usuario.id == data.cliente_id))
        if result.scalar_one_or_none() is None:
            raise RecursoNoEncontradoError("Cliente no encontrado")

        proyecto = Proyecto(**data.model_dump())
        db.add(proyecto)
        await db.flush()
        return ProyectoSummary.model_validate(proyecto)

    async def _get_project(self, db: AsyncSession, project_id: UUID) -> Proyecto:
        result = await db.execute(select(Proyecto).where(Proyecto.id == project_id))
        proyecto = result.scalar_one_or_none()
        if proyecto is None:
            raise RecursoNoEncontradoError("Proyecto no encontrado")
        return proyecto

    async def update_project(self, db: AsyncSession, project_id: UUID, data: AdminProyectoUpdate):
        proyecto = await self._get_project(db, project_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(proyecto, key, value)

        if data.progreso is not None:
            await self._notify_progress(db, proyecto)

        return ProyectoSummary.model_validate(proyecto)

    async def get_project_detail(self, db: AsyncSession, project_id: UUID) -> ProyectoDetail:
        result = await db.execute(
            select(Proyecto)
            .options(
                selectinload(Proyecto.hitos),
                selectinload(Proyecto.entregables),
                selectinload(Proyecto.bitacoras),
                selectinload(Proyecto.previews),
            )
            .where(Proyecto.id == project_id)
        )
        proyecto = result.scalar_one_or_none()
        if proyecto is None:
            raise RecursoNoEncontradoError("Proyecto no encontrado")
        return ProyectoDetail.model_validate(proyecto)

    async def _recalculate_progress(self, db: AsyncSession, project_id: UUID) -> None:
        result = await db.execute(select(Hito).where(Hito.proyecto_id == project_id))
        hitos = result.scalars().all()
        if not hitos:
            return
        completados = sum(1 for h in hitos if h.estado == "completado")
        progreso = round((completados / len(hitos)) * 100)
        proyecto = await self._get_project(db, project_id)
        if proyecto.progreso != progreso:
            proyecto.progreso = progreso
            await self._notify_progress(db, proyecto)

    async def create_hito(self, db: AsyncSession, project_id: UUID, data: AdminHitoCreate):
        await self._get_project(db, project_id)
        hito = Hito(proyecto_id=project_id, **data.model_dump())
        db.add(hito)
        await db.flush()
        await self._recalculate_progress(db, project_id)
        return hito

    async def update_hito(self, db: AsyncSession, hito_id: UUID, data: AdminHitoUpdate):
        result = await db.execute(select(Hito).where(Hito.id == hito_id))
        hito = result.scalar_one_or_none()
        if hito is None:
            raise RecursoNoEncontradoError("Hito no encontrado")
        old_estado = hito.estado
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(hito, key, value)
        await db.flush()
        await self._recalculate_progress(db, hito.proyecto_id)
        if data.estado and data.estado != old_estado:
            proyecto = await self._get_project(db, hito.proyecto_id)
            await self._notify_client(
                db,
                proyecto,
                "Actualizacion en tu linea de tiempo",
                f"El hito «{hito.titulo}» cambio a: {hito.estado}.",
                f"/portal/proyectos/{hito.proyecto_id}",
            )
        return hito

    async def delete_hito(self, db: AsyncSession, hito_id: UUID) -> None:
        result = await db.execute(select(Hito).where(Hito.id == hito_id))
        hito = result.scalar_one_or_none()
        if hito is None:
            raise RecursoNoEncontradoError("Hito no encontrado")
        project_id = hito.proyecto_id
        await db.delete(hito)
        await db.flush()
        await self._recalculate_progress(db, project_id)

    async def create_bitacora(self, db: AsyncSession, project_id: UUID, data: AdminBitacoraCreate):
        proyecto = await self._get_project(db, project_id)
        bitacora = Bitacora(proyecto_id=project_id, contenido=sanitize_text(data.contenido))
        db.add(bitacora)
        await db.flush()
        await self._notify_client(
            db,
            proyecto,
            "Nuevo avance en tu proyecto",
            data.contenido[:200],
            f"/portal/proyectos/{project_id}",
        )
        return bitacora

    async def create_entregable(self, db: AsyncSession, project_id: UUID, data: AdminEntregableCreate):
        validate_archivo_url(data.archivo_url)
        proyecto = await self._get_project(db, project_id)
        entregable = Entregable(proyecto_id=project_id, **data.model_dump())
        db.add(entregable)
        await db.flush()
        await self._notify_client(
            db,
            proyecto,
            "Nuevo entregable disponible",
            data.titulo,
            f"/portal/proyectos/{project_id}",
        )
        return entregable

    async def create_entregable_from_upload(
        self,
        db: AsyncSession,
        project_id: UUID,
        titulo: str,
        descripcion: str | None,
        relative_path: str,
        original_name: str,
    ):
        proyecto = await self._get_project(db, project_id)
        entregable = Entregable(
            proyecto_id=project_id,
            titulo=titulo,
            descripcion=descripcion,
            archivo_url=relative_path,
            archivo_nombre=original_name,
        )
        db.add(entregable)
        await db.flush()
        await self._notify_client(
            db,
            proyecto,
            "Nuevo entregable disponible",
            titulo,
            f"/portal/proyectos/{project_id}",
        )
        return entregable

    async def create_preview(self, db: AsyncSession, project_id: UUID, data: AdminPreviewCreate):
        await self._get_project(db, project_id)
        preview = Preview(proyecto_id=project_id, **data.model_dump())
        db.add(preview)
        await db.flush()
        return preview

    async def _notify_client(self, db: AsyncSession, proyecto: Proyecto, titulo: str, mensaje: str, enlace: str):
        notif = Notificacion(
            usuario_id=proyecto.cliente_id,
            titulo=titulo,
            mensaje=mensaje,
            enlace=enlace,
        )
        db.add(notif)

    async def _notify_progress(self, db: AsyncSession, proyecto: Proyecto):
        await self._notify_client(
            db,
            proyecto,
            "Progreso actualizado",
            f"El proyecto {proyecto.nombre} avanzo al {proyecto.progreso}%.",
            f"/portal/proyectos/{proyecto.id}",
        )


admin_service = AdminService()
