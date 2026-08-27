"""
ZomiDev Backend — Excepciones personalizadas
"""
from fastapi import HTTPException, status


class ZomiDevError(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class CredencialesInvalidasError(ZomiDevError):
    def __init__(self, detail: str = "Credenciales invalidas"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)


class TokenExpiradoError(ZomiDevError):
    def __init__(self, detail: str = "Token expirado o invalido"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)


class PermisosDenegadosError(ZomiDevError):
    def __init__(self, detail: str = "Permisos insuficientes"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class RecursoNoEncontradoError(ZomiDevError):
    def __init__(self, detail: str = "Recurso no encontrado"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class ServicioNoDisponibleError(ZomiDevError):
    def __init__(self, detail: str = "Servicio temporalmente no disponible"):
        super().__init__(detail=detail, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
