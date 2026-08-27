"""Servicio de archivos — subida y descarga de entregables"""
import logging
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.config import settings
from app.core.exceptions import ZomiDevError

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".zip", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".csv",
}
ALLOWED_MIME_PREFIXES = (
    "application/pdf",
    "application/msword",
    "application/vnd.",
    "application/zip",
    "application/x-zip-compressed",
    "image/",
    "text/plain",
    "text/csv",
)

# Firmas magic bytes por extension
MAGIC_SIGNATURES: dict[str, list[bytes]] = {
    ".pdf": [b"%PDF"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".webp": [b"RIFF"],
    ".zip": [b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"],
    ".docx": [b"PK\x03\x04"],
    ".xlsx": [b"PK\x03\x04"],
    ".pptx": [b"PK\x03\x04"],
    ".doc": [b"\xd0\xcf\x11\xe0"],
    ".xls": [b"\xd0\xcf\x11\xe0"],
    ".ppt": [b"\xd0\xcf\x11\xe0"],
    ".txt": [],  # texto plano — sin firma obligatoria
    ".csv": [],
}


def get_upload_root() -> Path:
    root = Path(settings.UPLOAD_DIR)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _matches_magic(content: bytes, ext: str) -> bool:
    signatures = MAGIC_SIGNATURES.get(ext, [])
    if not signatures:
        return True
    if ext == ".webp":
        return content.startswith(b"RIFF") and b"WEBP" in content[:16]
    return any(content.startswith(sig) for sig in signatures)


def _validate_file_metadata(file: UploadFile, size: int) -> str:
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if size > max_bytes:
        raise ZomiDevError(f"El archivo excede el limite de {settings.MAX_UPLOAD_SIZE_MB} MB")

    filename = file.filename or ""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ZomiDevError(f"Tipo de archivo no permitido: {ext or 'desconocido'}")

    content_type = (file.content_type or "").lower()
    if content_type and not any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        raise ZomiDevError("Tipo MIME no permitido")

    return ext


def _validate_content(content: bytes, ext: str) -> None:
    if not _matches_magic(content, ext):
        raise ZomiDevError("El contenido del archivo no coincide con su extension")


def validate_archivo_url(relative_path: str) -> None:
    """Valida rutas manuales de entregables contra path traversal."""
    root = get_upload_root().resolve()
    full = (root / relative_path).resolve()
    if not full.is_relative_to(root):
        raise ZomiDevError("Ruta de archivo invalida", status_code=403)


async def save_entregable_file(project_id: uuid.UUID, file: UploadFile) -> tuple[str, str]:
    """Guarda archivo con lectura incremental y validacion de contenido."""
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    chunks: list[bytes] = []
    total = 0
    chunk_size = 1024 * 256

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise ZomiDevError(f"El archivo excede el limite de {settings.MAX_UPLOAD_SIZE_MB} MB")
        chunks.append(chunk)

    content = b"".join(chunks)
    ext = _validate_file_metadata(file, len(content))
    _validate_content(content[:512], ext)

    original_name = Path(file.filename or "archivo").name
    stored_name = f"{uuid.uuid4().hex}{ext}"
    relative_dir = Path(str(project_id))
    target_dir = get_upload_root() / relative_dir
    target_dir.mkdir(parents=True, exist_ok=True)

    target_path = target_dir / stored_name
    target_path.write_bytes(content)

    relative_path = str(relative_dir / stored_name)
    logger.info(f"Archivo guardado: {relative_path} ({original_name})")
    return relative_path, original_name


def resolve_entregable_path(relative_path: str) -> Path:
    root = get_upload_root().resolve()
    full = (root / relative_path).resolve()
    if not full.is_relative_to(root):
        raise ZomiDevError("Ruta de archivo invalida", status_code=403)
    if not full.is_file():
        raise ZomiDevError("Archivo no encontrado", status_code=404)
    return full
