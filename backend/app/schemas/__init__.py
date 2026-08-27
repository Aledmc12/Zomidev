from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.password import validate_password


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    ok: bool
    message: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20)
    password: str = Field(min_length=10)

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        validate_password(v, for_admin=False)
        return v


class RefreshResponse(BaseModel):
    ok: bool = True


class UsuarioResponse(BaseModel):
    id: UUID
    email: str
    nombre: str
    empresa: Optional[str] = None
    rol: str
    activo: bool

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    user: UsuarioResponse


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    user: UsuarioResponse


class HitoResponse(BaseModel):
    id: UUID
    titulo: str
    descripcion: Optional[str] = None
    estado: str
    orden: int
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None

    model_config = {"from_attributes": True}


class EntregableResponse(BaseModel):
    id: UUID
    titulo: str
    descripcion: Optional[str] = None
    archivo_url: str
    archivo_nombre: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BitacoraResponse(BaseModel):
    id: UUID
    contenido: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PreviewResponse(BaseModel):
    id: UUID
    titulo: str
    imagen_url: Optional[str] = None
    staging_url: Optional[str] = None
    orden: int

    model_config = {"from_attributes": True}


class ProyectoSummary(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str] = None
    progreso: int
    estado: str
    staging_url: Optional[str] = None
    proxima_entrega: Optional[date] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProyectoDetail(ProyectoSummary):
    hitos: List[HitoResponse] = []
    entregables: List[EntregableResponse] = []
    bitacoras: List[BitacoraResponse] = []
    previews: List[PreviewResponse] = []


class DashboardResponse(BaseModel):
    proyectos_activos: int
    proxima_entrega: Optional[date] = None
    tareas_pendientes: int
    progreso_general: int
    proyectos: List[ProyectoSummary]


class MensajeCreate(BaseModel):
    proyecto_id: UUID
    contenido: str = Field(min_length=1, max_length=5000)


class MensajeResponse(BaseModel):
    id: UUID
    proyecto_id: UUID
    autor_id: UUID
    autor_nombre: str
    autor_rol: str
    contenido: str
    leido_at: Optional[datetime] = None
    created_at: datetime


class NotificacionResponse(BaseModel):
    id: UUID
    titulo: str
    mensaje: str
    leida: bool
    enlace: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PortafolioResponse(BaseModel):
    id: UUID
    slug: str
    titulo: str
    resumen: str
    problema: str
    solucion: str
    stack: str
    resultado: str
    imagen_url: Optional[str] = None
    url_externa: Optional[str] = None
    destacado: bool

    model_config = {"from_attributes": True}


class ServicioResponse(BaseModel):
    id: UUID
    slug: str
    titulo: str
    descripcion: str
    icono: str

    model_config = {"from_attributes": True}


class AboutSectionResponse(BaseModel):
    id: UUID
    titulo: str
    contenido: str

    model_config = {"from_attributes": True}


class TeamMemberResponse(BaseModel):
    id: UUID
    nombre: str
    rol: str
    bio: Optional[str] = None

    model_config = {"from_attributes": True}


class ContactInfoResponse(BaseModel):
    clave: str
    valor: str
    etiqueta: str

    model_config = {"from_attributes": True}


class ContactFormRequest(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    email: EmailStr
    asunto: str = Field(min_length=3, max_length=200)
    mensaje: str = Field(min_length=10, max_length=5000)
    empresa: Optional[str] = Field(default=None, max_length=150)
    website: Optional[str] = Field(default=None, max_length=200)


class ContactFormResponse(BaseModel):
    ok: bool
    message: str
