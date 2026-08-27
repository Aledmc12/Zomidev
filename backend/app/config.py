"""
ZomiDev Backend — Configuracion central
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "ZomiDev API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = ""

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    REDIS_CACHE_TTL: int = 300

    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@zomidev.com"
    FROM_NAME: str = "ZomiDev"
    CONTACT_EMAIL: str = "aledmc@zomidev.com"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 25

    ALLOWED_ORIGINS: str = "http://localhost:3000"
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    TRUSTED_PROXY_HOSTS: str = ""

    PASSWORD_RESET_EXPIRE_MINUTES: int = 60

    LOG_LEVEL: str = "INFO"

    SENTRY_DSN: str = ""
    SENTRY_ENVIRONMENT: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1

    SEED_ADMIN_EMAIL: str = "admin@zomidev.com"
    SEED_ADMIN_PASSWORD: str = "Admin123!"
    SEED_CLIENT_EMAIL: str = "cliente@ejemplo.com"
    SEED_CLIENT_PASSWORD: str = "Cliente123!"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v:
            return v
        return str(v).strip()

    @model_validator(mode="after")
    def validate_critical_settings(self) -> "Settings":
        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY no puede estar vacio. Generarlo con: openssl rand -hex 32"
            )
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY debe tener al menos 32 caracteres.")
        if self.ENVIRONMENT == "production":
            if self.DEBUG:
                raise ValueError("DEBUG debe ser False en produccion.")
            if not self.DATABASE_URL:
                raise ValueError("DATABASE_URL es requerido en produccion.")
            if "localhost" in self.ALLOWED_ORIGINS and len(self.get_cors_origins()) <= 2:
                raise ValueError("ALLOWED_ORIGINS debe configurarse para produccion.")
            if self.SEED_ADMIN_PASSWORD in ("Admin123!", "ChangeMe123!"):
                raise ValueError("SEED_ADMIN_PASSWORD no puede ser el valor por defecto en produccion.")
        return self

    def get_trusted_proxy_hosts(self) -> List[str]:
        return [h.strip() for h in self.TRUSTED_PROXY_HOSTS.split(",") if h.strip()]

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    def get_allowed_hosts(self) -> List[str]:
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def redis_url(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
