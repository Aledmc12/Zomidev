"""Endpoints publicos del sitio"""
from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import (
    AboutSectionResponse,
    ContactFormRequest,
    ContactFormResponse,
    ContactInfoResponse,
    PortafolioResponse,
    ServicioResponse,
    TeamMemberResponse,
)
from app.services.public_service import public_service
from app.utils.redis_client import check_rate_limit
from app.utils.request import get_client_ip

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/portfolio", response_model=list[PortafolioResponse])
async def list_portfolio(
    featured: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
):
    return await public_service.list_portfolio(db, featured_only=featured)


@router.get("/portfolio/{slug}", response_model=PortafolioResponse)
async def get_portfolio_item(slug: str, db: AsyncSession = Depends(get_db)):
    return await public_service.get_portfolio_item(db, slug)


@router.get("/services", response_model=list[ServicioResponse])
async def list_services(db: AsyncSession = Depends(get_db)):
    return await public_service.list_services(db)


@router.get("/about", response_model=list[AboutSectionResponse])
async def list_about(db: AsyncSession = Depends(get_db)):
    return await public_service.list_about(db)


@router.get("/team", response_model=list[TeamMemberResponse])
async def list_team(db: AsyncSession = Depends(get_db)):
    return await public_service.list_team(db)


@router.get("/contact-info", response_model=list[ContactInfoResponse])
async def list_contact_info(db: AsyncSession = Depends(get_db)):
    return await public_service.list_contact_info(db)


@router.post("/contact", response_model=ContactFormResponse)
async def submit_contact(
    data: ContactFormRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = get_client_ip(request)
    permitido, _ = await check_rate_limit(
        f"contact:{ip}", limit=5, window_seconds=3600, prefix="rl", fail_closed=True
    )
    if not permitido:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Demasiados intentos. Intenta de nuevo en una hora."},
        )
    return await public_service.submit_contact(db, data)
