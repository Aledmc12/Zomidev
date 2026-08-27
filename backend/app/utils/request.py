"""Utilidades de request HTTP"""
from fastapi import Request

from app.config import settings


def get_client_ip(request: Request) -> str:
    """Resuelve IP del cliente respetando proxies de confianza (Nginx / Cloudflare)."""
    trusted = settings.get_trusted_proxy_hosts()
    if trusted:
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            candidate = forwarded.split(",")[0].strip()
            if candidate:
                return candidate
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
    return request.client.host if request.client else "unknown"
