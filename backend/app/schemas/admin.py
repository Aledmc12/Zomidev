from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.password import validate_password


class AdminUsuarioCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10)
    nombre: str = Field(min_length=2, max_length=100)
    empresa: Optional[str] = Field(default=None, max_length=150)
    rol: str = Field(default="client", pattern="^(client|admin)$")

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str, info) -> str:
        rol = info.data.get("rol", "client")
        validate_password(v, for_admin=(rol == "admin"))
        return v


class AdminUsuarioResponse(BaseModel):
    id: UUID
    email: str
    nombre: str
    empresa: Optional[str] = None
    rol: str
    activo: bool

    model_config = {"from_attributes": True}


class AdminProyectoCreate(BaseModel):
    cliente_id: UUID
    nombre: str = Field(min_length=2, max_length=200)
    descripcion: Optional[str] = None
    progreso: int = Field(default=0, ge=0, le=100)
    estado: str = Field(default="activo")
    staging_url: Optional[str] = None
    proxima_entrega: Optional[date] = None


class AdminProyectoUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=200)
    descripcion: Optional[str] = None
    progreso: Optional[int] = Field(default=None, ge=0, le=100)
    estado: Optional[str] = None
    staging_url: Optional[str] = None
    proxima_entrega: Optional[date] = None


class AdminHitoCreate(BaseModel):
    titulo: str = Field(min_length=2, max_length=150)
    descripcion: Optional[str] = None
    estado: str = Field(default="pendiente")
    orden: int = 0
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None


class AdminHitoUpdate(BaseModel):
    titulo: Optional[str] = Field(default=None, min_length=2, max_length=150)
    descripcion: Optional[str] = None
    estado: Optional[str] = None
    orden: Optional[int] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None


class AdminBitacoraCreate(BaseModel):
    contenido: str = Field(min_length=5, max_length=5000)


class AdminEntregableCreate(BaseModel):
    titulo: str = Field(min_length=2, max_length=200)
    descripcion: Optional[str] = None
    archivo_url: str = Field(min_length=5, max_length=500)


class AdminPreviewCreate(BaseModel):
    titulo: str = Field(min_length=2, max_length=150)
    imagen_url: Optional[str] = None
    staging_url: Optional[str] = None
    orden: int = 0


class AdminStatsResponse(BaseModel):
    total_clientes: int
    total_proyectos: int
    proyectos_activos: int
    mensajes_sin_leer: int
