"""Servicio de contenido publico"""
import logging
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import RecursoNoEncontradoError
from app.models.about import AboutSection, TeamMember
from app.models.contacto import ContactInfo, ContactSubmission
from app.models.portafolio import PortafolioItem
from app.models.servicio import Servicio
from app.schemas import (
    AboutSectionResponse,
    ContactFormRequest,
    ContactFormResponse,
    ContactInfoResponse,
    PortafolioResponse,
    ServicioResponse,
    TeamMemberResponse,
)
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


class PublicService:
    async def list_portfolio(self, db: AsyncSession, featured_only: bool = False) -> List[PortafolioResponse]:
        query = select(PortafolioItem).where(PortafolioItem.activo.is_(True)).order_by(PortafolioItem.orden)
        if featured_only:
            query = query.where(PortafolioItem.destacado.is_(True))
        result = await db.execute(query)
        return [PortafolioResponse.model_validate(item) for item in result.scalars().all()]

    async def get_portfolio_item(self, db: AsyncSession, slug: str) -> PortafolioResponse:
        result = await db.execute(
            select(PortafolioItem).where(PortafolioItem.slug == slug, PortafolioItem.activo.is_(True))
        )
        item = result.scalar_one_or_none()
        if item is None:
            raise RecursoNoEncontradoError("Proyecto de portafolio no encontrado")
        return PortafolioResponse.model_validate(item)

    async def list_services(self, db: AsyncSession) -> List[ServicioResponse]:
        result = await db.execute(
            select(Servicio).where(Servicio.activo.is_(True)).order_by(Servicio.orden)
        )
        return [ServicioResponse.model_validate(s) for s in result.scalars().all()]

    async def list_about(self, db: AsyncSession) -> List[AboutSectionResponse]:
        result = await db.execute(
            select(AboutSection).where(AboutSection.activo.is_(True)).order_by(AboutSection.orden)
        )
        return [AboutSectionResponse.model_validate(s) for s in result.scalars().all()]

    async def list_team(self, db: AsyncSession) -> List[TeamMemberResponse]:
        result = await db.execute(
            select(TeamMember).where(TeamMember.activo.is_(True)).order_by(TeamMember.orden)
        )
        return [TeamMemberResponse.model_validate(m) for m in result.scalars().all()]

    async def list_contact_info(self, db: AsyncSession) -> List[ContactInfoResponse]:
        result = await db.execute(select(ContactInfo).order_by(ContactInfo.etiqueta))
        return [ContactInfoResponse.model_validate(c) for c in result.scalars().all()]

    async def submit_contact(self, db: AsyncSession, data: ContactFormRequest) -> ContactFormResponse:
        if data.website:
            logger.warning("Contacto rechazado: honeypot activado")
            return ContactFormResponse(ok=True, message="Mensaje recibido. Te contactaremos pronto.")

        submission = ContactSubmission(
            nombre=data.nombre.strip(),
            email=str(data.email).lower(),
            asunto=data.asunto.strip(),
            mensaje=data.mensaje.strip(),
            empresa=data.empresa.strip() if data.empresa else None,
        )
        db.add(submission)
        await db.flush()

        await email_service.enviar_contacto(
            nombre=submission.nombre,
            email=submission.email,
            asunto=submission.asunto,
            mensaje=submission.mensaje,
            empresa=submission.empresa,
        )

        return ContactFormResponse(ok=True, message="Mensaje recibido. Te contactaremos pronto.")


public_service = PublicService()
