"""Sanitizacion de contenido de usuario"""
import html
import re

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def escape_html(value: str) -> str:
    return html.escape(value or "", quote=True)


def sanitize_text(value: str, max_length: int = 5000) -> str:
    cleaned = (value or "").strip()
    cleaned = _CONTROL_CHARS.sub("", cleaned)
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned
