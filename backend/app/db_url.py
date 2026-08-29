"""
Utilidades para DATABASE_URL: SSL (asyncpg) y preferencia IPv4 (Docker sin IPv6).
"""
import logging
import socket
import ssl
from dataclasses import dataclass
from ipaddress import ip_address
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

logger = logging.getLogger(__name__)

_ASYNCPG_STRIP_QUERY_KEYS = frozenset({"sslmode", "ssl"})
_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})


def _is_ip_address(host: str) -> bool:
    try:
        ip_address(host)
        return True
    except ValueError:
        return False


def resolve_ipv4(hostname: str) -> str | None:
    """Resuelve hostname a IPv4. None si no aplica o no hay registro A."""
    if not hostname or hostname in _LOCAL_HOSTS or _is_ip_address(hostname):
        return None
    try:
        results = socket.getaddrinfo(
            hostname, None, family=socket.AF_INET, type=socket.SOCK_STREAM
        )
    except socket.gaierror:
        return None
    return results[0][4][0] if results else None


def _replace_hostname(url: str, new_host: str) -> str:
    parsed = urlparse(url)
    if not parsed.hostname:
        return url

    userinfo = ""
    if parsed.username is not None:
        userinfo = parsed.username
        if parsed.password is not None:
            userinfo += f":{parsed.password}"
        userinfo += "@"

    port_suffix = f":{parsed.port}" if parsed.port else ""
    new_netloc = f"{userinfo}{new_host}{port_suffix}"
    return urlunparse(parsed._replace(netloc=new_netloc))


def _normalize_postgres_url(url: str) -> str:
    url = url.strip()
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _is_direct_supabase_host(hostname: str | None) -> bool:
    """db.PROJECT.supabase.co solo tiene IPv6; el pooler ya expone IPv4."""
    return bool(hostname and hostname.startswith("db.") and hostname.endswith(".supabase.co"))


def _ssl_required(query_pairs: list[tuple[str, str]], hostname: str | None) -> bool:
    for key, value in query_pairs:
        if key in _ASYNCPG_STRIP_QUERY_KEYS:
            if value.lower() in {"require", "verify-ca", "verify-full", "prefer", "true", "1"}:
                return True
    return bool(hostname and "supabase.co" in hostname)


def _async_ssl_context(*, force_ipv4: bool) -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    # Con IP directa el cert no coincide con el hostname; verificamos CA de Supabase.
    if force_ipv4:
        ctx.check_hostname = False
    return ctx


@dataclass(frozen=True)
class PreparedDatabaseUrls:
    sync_url: str
    async_url: str
    async_connect_args: dict


def prepare_database_urls(raw_url: str) -> PreparedDatabaseUrls:
    if not raw_url:
        return PreparedDatabaseUrls("", "", {})

    url = _normalize_postgres_url(raw_url)
    parsed = urlparse(url)
    hostname = parsed.hostname
    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    ipv4 = resolve_ipv4(hostname) if hostname else None

    if hostname and "supabase.co" in hostname and not ipv4:
        if hostname.startswith("db."):
            logger.error(
                "Host %s no tiene IPv4 (solo IPv6). En VPS usa Session pooler: "
                "postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres",
                hostname,
            )
        else:
            logger.warning(
                "No se encontro registro A (IPv4) para %s.",
                hostname,
            )

    sync_pairs = list(query_pairs)
    use_ipv4_fallback = bool(ipv4 and _is_direct_supabase_host(hostname))
    if use_ipv4_fallback and not any(key == "hostaddr" for key, _ in sync_pairs):
        sync_pairs.append(("hostaddr", ipv4))
        logger.info("DATABASE_URL: conexion IPv4 %s -> %s", hostname, ipv4)

    sync_url = urlunparse(parsed._replace(query=urlencode(sync_pairs)))

    async_pairs: list[tuple[str, str]] = []
    connect_args: dict = {}
    ssl_needed = _ssl_required(query_pairs, hostname)

    for key, value in query_pairs:
        if key in _ASYNCPG_STRIP_QUERY_KEYS or key == "hostaddr":
            continue
        async_pairs.append((key, value))

    async_base = urlunparse(parsed._replace(query=urlencode(async_pairs)))

    if use_ipv4_fallback:
        async_base = _replace_hostname(async_base, ipv4)

    if ssl_needed:
        connect_args["ssl"] = _async_ssl_context(force_ipv4=use_ipv4_fallback)

    async_url = async_base.replace("postgresql://", "postgresql+asyncpg://", 1)
    return PreparedDatabaseUrls(
        sync_url=sync_url,
        async_url=async_url,
        async_connect_args=connect_args,
    )
