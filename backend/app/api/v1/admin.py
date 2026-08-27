"""Panel admin ZomiDev"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin
from app.database import get_db
from app.schemas import ProyectoDetail, ProyectoSummary
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
from app.services.admin_service import admin_service
from app.services.file_service import save_entregable_file, validate_archivo_url

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
async def stats(db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    return await admin_service.get_stats(db)


@router.get("/clients", response_model=List[AdminUsuarioResponse])
async def list_clients(db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    return await admin_service.list_clients(db)


@router.post("/clients", response_model=AdminUsuarioResponse)
async def create_client(
    data: AdminUsuarioCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await admin_service.create_client(db, data)


@router.get("/projects", response_model=List[ProyectoSummary])
async def list_projects(db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    return await admin_service.list_projects(db)


@router.post("/projects", response_model=ProyectoSummary)
async def create_project(
    data: AdminProyectoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await admin_service.create_project(db, data)


@router.get("/projects/{project_id}", response_model=ProyectoDetail)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    return await admin_service.get_project_detail(db, project_id)


@router.patch("/projects/{project_id}", response_model=ProyectoSummary)
async def update_project(
    project_id: UUID,
    data: AdminProyectoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await admin_service.update_project(db, project_id, data)


@router.post("/projects/{project_id}/hitos")
async def create_hito(
    project_id: UUID,
    data: AdminHitoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    hito = await admin_service.create_hito(db, project_id, data)
    return {"id": hito.id, "titulo": hito.titulo, "estado": hito.estado}


@router.patch("/hitos/{hito_id}")
async def update_hito(
    hito_id: UUID,
    data: AdminHitoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    hito = await admin_service.update_hito(db, hito_id, data)
    return {"id": hito.id, "titulo": hito.titulo, "estado": hito.estado}


@router.delete("/hitos/{hito_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hito(
    hito_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    await admin_service.delete_hito(db, hito_id)
    return None


@router.post("/projects/{project_id}/bitacoras")
async def create_bitacora(
    project_id: UUID,
    data: AdminBitacoraCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    bitacora = await admin_service.create_bitacora(db, project_id, data)
    return {"id": bitacora.id, "contenido": bitacora.contenido, "created_at": bitacora.created_at}


@router.post("/projects/{project_id}/entregables")
async def create_entregable(
    project_id: UUID,
    data: AdminEntregableCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    entregable = await admin_service.create_entregable(db, project_id, data)
    return {"id": entregable.id, "titulo": entregable.titulo}


@router.post("/projects/{project_id}/entregables/upload")
async def upload_entregable(
    project_id: UUID,
    titulo: str = Form(..., min_length=2, max_length=200),
    descripcion: Optional[str] = Form(default=None),
    archivo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    relative_path, original_name = await save_entregable_file(project_id, archivo)
    entregable = await admin_service.create_entregable_from_upload(
        db,
        project_id,
        titulo=titulo.strip(),
        descripcion=descripcion.strip() if descripcion else None,
        relative_path=relative_path,
        original_name=original_name,
    )
    return {
        "id": entregable.id,
        "titulo": entregable.titulo,
        "archivo_nombre": entregable.archivo_nombre,
    }


@router.post("/projects/{project_id}/previews")
async def create_preview(
    project_id: UUID,
    data: AdminPreviewCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    preview = await admin_service.create_preview(db, project_id, data)
    return {"id": preview.id, "titulo": preview.titulo}
