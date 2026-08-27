"""Portal de clientes"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_client
from app.database import get_db
from app.schemas import (
    DashboardResponse,
    MensajeCreate,
    MensajeResponse,
    NotificacionResponse,
    ProyectoDetail,
    ProyectoSummary,
)
from app.services.file_service import resolve_entregable_path
from app.services.portal_service import portal_service

router = APIRouter(prefix="/portal", tags=["Portal"])


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_client),
):
    return await portal_service.get_dashboard(db, current_user)


@router.get("/projects", response_model=List[ProyectoSummary])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_client),
):
    return await portal_service.list_projects(db, current_user)


@router.get("/projects/{project_id}", response_model=ProyectoDetail)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_client),
):
    return await portal_service.get_project(db, current_user, project_id)


@router.get("/messages", response_model=List[MensajeResponse])
async def list_messages(
    project_id: Optional[UUID] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_client),
):
    return await portal_service.list_messages(db, current_user, project_id)


@router.post("/messages", response_model=MensajeResponse)
async def create_message(
    data: MensajeCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_client),
):
    return await portal_service.create_message(db, current_user, data)


@router.get("/notifications", response_model=List[NotificacionResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_client),
):
    return await portal_service.list_notifications(db, current_user)


@router.patch("/notifications/{notification_id}/read", response_model=NotificacionResponse)
async def mark_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_client),
):
    return await portal_service.mark_notification_read(db, current_user, notification_id)


@router.get("/entregables/{entregable_id}/download")
async def download_entregable(
    entregable_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_client),
):
    entregable = await portal_service.get_entregable_for_download(db, current_user, entregable_id)
    file_path = resolve_entregable_path(entregable.archivo_url)
    filename = entregable.archivo_nombre or file_path.name
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )
