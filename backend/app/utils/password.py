"""Validacion de contrasenas"""
import re

COMMON_PASSWORDS = {
    "password", "12345678", "123456789", "admin123", "admin123!",
    "cliente123!", "qwerty123", "password1", "password123",
}

_PASSWORD_RE = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\;/]).{12,}$"
)


def validate_password(password: str, *, for_admin: bool = False) -> None:
    min_len = 12 if for_admin else 10
    if len(password) < min_len:
        raise ValueError(f"La contrasena debe tener al menos {min_len} caracteres.")
    if password.lower() in COMMON_PASSWORDS:
        raise ValueError("La contrasena es demasiado comun.")
    if not _PASSWORD_RE.match(password):
        raise ValueError(
            "La contrasena debe incluir mayuscula, minuscula, numero y simbolo."
        )
