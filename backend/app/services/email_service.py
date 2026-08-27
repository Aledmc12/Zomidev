"""Servicio de email transaccional con Resend"""
import logging

import resend

from app.config import settings
from app.utils.sanitize import escape_html

logger = logging.getLogger(__name__)

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

_GOLD = "#c9a962"
_BONE = "#f5f0e8"
_MUTED = "#9a9590"
_BG = "#0d0d0d"
_FONT = "'Montserrat', 'Helvetica Neue', Arial, sans-serif"


class EmailService:
    def _from_address(self) -> str:
        return f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"

    def _wrap(self, body_html: str, preheader: str = "") -> str:
        return f"""\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:{_BG};font-family:{_FONT};">
  <span style="display:none;font-size:1px;color:{_BG};">{escape_html(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{_BG};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#161616;border-radius:12px;border:1px solid #2a2a2a;">
        <tr><td style="padding:36px;color:{_BONE};font-size:15px;line-height:1.6;">{body_html}</td></tr>
        <tr><td style="padding:20px 36px 32px;border-top:1px solid #2a2a2a;">
          <p style="margin:0;color:{_MUTED};font-size:12px;">&copy; {escape_html(settings.FROM_NAME)} — Mensaje automatico.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    def _puede_enviar(self) -> bool:
        if not settings.RESEND_API_KEY:
            logger.warning("RESEND_API_KEY no configurado — email simulado en logs")
            return False
        return True

    async def enviar_contacto(
        self,
        nombre: str,
        email: str,
        asunto: str,
        mensaje: str,
        empresa: str | None = None,
    ) -> bool:
        safe_nombre = escape_html(nombre)
        safe_email = escape_html(email)
        safe_asunto = escape_html(asunto)
        safe_mensaje = escape_html(mensaje)
        safe_empresa = escape_html(empresa) if empresa else ""
        empresa_html = f"<p><strong>Empresa:</strong> {safe_empresa}</p>" if empresa else ""
        body = f"""
        <h1 style="margin:0 0 16px;font-size:20px;color:{_GOLD};">Nuevo mensaje de contacto</h1>
        <p><strong>Nombre:</strong> {safe_nombre}</p>
        <p><strong>Email:</strong> {safe_email}</p>
        {empresa_html}
        <p><strong>Asunto:</strong> {safe_asunto}</p>
        <div style="margin-top:20px;padding:16px;background:#0d0d0d;border-radius:8px;border-left:3px solid {_GOLD};">
          <p style="margin:0;white-space:pre-wrap;">{safe_mensaje}</p>
        </div>
        """
        payload = {
            "from": self._from_address(),
            "to": [settings.CONTACT_EMAIL],
            "reply_to": email,
            "subject": f"[ZomiDev Contacto] {asunto[:100]}",
            "html": self._wrap(body, preheader=f"Mensaje de {nombre}: {asunto}"),
        }
        if not self._puede_enviar():
            logger.info(f"[EMAIL DEV] contacto → {settings.CONTACT_EMAIL} | {nombre} <{email}> | {asunto}")
            return True
        try:
            resend.Emails.send(payload)
            logger.info(f"Email de contacto enviado a {settings.CONTACT_EMAIL}")
            return True
        except Exception as e:
            logger.error(f"Error enviando email de contacto: {e}")
            return False

    async def enviar_reset_password(self, email: str, reset_url: str) -> bool:
        safe_url = escape_html(reset_url)
        body = f"""
        <h1 style="margin:0 0 16px;font-size:20px;color:{_GOLD};">Recuperar contrasena</h1>
        <p>Recibimos una solicitud para restablecer tu contrasena en ZomiDev.</p>
        <p style="margin:24px 0;">
          <a href="{safe_url}" style="display:inline-block;padding:12px 24px;background:{_GOLD};color:#0d0d0d;text-decoration:none;border-radius:8px;font-weight:600;">
            Restablecer contrasena
          </a>
        </p>
        <p style="color:{_MUTED};font-size:13px;">Este enlace expira en {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutos. Si no solicitaste esto, ignora este mensaje.</p>
        """
        payload = {
            "from": self._from_address(),
            "to": [email],
            "subject": "Recuperar contrasena — ZomiDev",
            "html": self._wrap(body, preheader="Restablece tu contrasena de ZomiDev"),
        }
        if not self._puede_enviar():
            logger.info(f"[EMAIL DEV] reset password → {email} | {reset_url}")
            return True
        try:
            resend.Emails.send(payload)
            return True
        except Exception as e:
            logger.error(f"Error enviando reset password: {e}")
            return False


email_service = EmailService()
