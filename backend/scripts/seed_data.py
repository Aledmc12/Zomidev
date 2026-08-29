"""
Seed de datos iniciales para ZomiDev.
Ejecutar desde /app:
  python -m scripts.seed_data
  python scripts/seed_data.py
"""
import asyncio
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

_APP_ROOT = Path(__file__).resolve().parents[1]
if str(_APP_ROOT) not in sys.path:
    sys.path.insert(0, str(_APP_ROOT))

from sqlalchemy import select

from app.config import settings
from app.core.security import hash_password
from app.database import AsyncSessionLocal, Base, engine
from app.models.about import AboutSection
from app.models.bitacora import Bitacora
from app.models.contacto import ContactInfo
from app.models.entregable import Entregable
from app.models.hito import Hito
from app.models.notificacion import Notificacion
from app.models.portafolio import PortafolioItem
from app.models.preview import Preview
from app.models.proyecto import Proyecto
from app.models.servicio import Servicio
from app.models.usuario import Usuario


async def seed() -> None:
    if settings.is_production and settings.SEED_ADMIN_PASSWORD in ("Admin123!", "ChangeMe123!"):
        raise RuntimeError("Refusing to seed with default password in production.")

    if engine is None:
        raise RuntimeError("DATABASE_URL no configurada")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(Usuario).limit(1))
        if existing:
            print("Datos ya existen, omitiendo seed.")
            return

        admin = Usuario(
            email=settings.SEED_ADMIN_EMAIL.lower(),
            nombre="Administrador ZomiDev",
            empresa="ZomiDev",
            hashed_password=hash_password(settings.SEED_ADMIN_PASSWORD),
            rol="admin",
        )
        client = Usuario(
            email=settings.SEED_CLIENT_EMAIL.lower(),
            nombre="Cliente Demo",
            empresa="Empresa Ejemplo S.A.S.",
            hashed_password=hash_password(settings.SEED_CLIENT_PASSWORD),
            rol="client",
        )
        db.add_all([admin, client])
        await db.flush()

        proyecto = Proyecto(
            cliente_id=client.id,
            nombre="Portal corporativo Empresa Ejemplo",
            descripcion="Sitio web institucional con portal de clientes y panel administrativo.",
            progreso=62,
            estado="activo",
            staging_url="https://staging.ejemplo.zomidev.com",
            proxima_entrega=date.today() + timedelta(days=14),
        )
        db.add(proyecto)
        await db.flush()

        hitos = [
            Hito(proyecto_id=proyecto.id, titulo="Diseno UX/UI", descripcion="Wireframes y sistema visual", estado="completado", orden=1, fecha_inicio=date.today() - timedelta(days=45), fecha_fin=date.today() - timedelta(days=30)),
            Hito(proyecto_id=proyecto.id, titulo="Desarrollo frontend", descripcion="Landing y portal responsive", estado="en_curso", orden=2, fecha_inicio=date.today() - timedelta(days=28)),
            Hito(proyecto_id=proyecto.id, titulo="Backend y APIs", descripcion="Autenticacion y endpoints", estado="en_curso", orden=3, fecha_inicio=date.today() - timedelta(days=20)),
            Hito(proyecto_id=proyecto.id, titulo="QA y entrega", descripcion="Pruebas y despliegue", estado="pendiente", orden=4),
        ]
        db.add_all(hitos)

        db.add_all([
            Bitacora(proyecto_id=proyecto.id, contenido="Actualizacion del 17 jul: se implemento el login del portal de clientes."),
            Bitacora(proyecto_id=proyecto.id, contenido="Actualizacion del 10 jul: avance del 55% con integracion de timeline de hitos."),
            Entregable(proyecto_id=proyecto.id, titulo="Wireframes v1", descripcion="Documento de diseno inicial", archivo_url="/uploads/wireframes-v1.pdf"),
            Preview(proyecto_id=proyecto.id, titulo="Home staging", staging_url=proyecto.staging_url, orden=1),
        ])

        db.add(Notificacion(
            usuario_id=client.id,
            titulo="Bienvenido al portal ZomiDev",
            mensaje="Tu proyecto ya esta disponible para seguimiento en tiempo real.",
            enlace=f"/portal/proyectos/{proyecto.id}",
        ))

        portfolio = [
            PortafolioItem(
                slug="wingconcept",
                titulo="WingConcept",
                resumen="Plataforma e-commerce full-stack para paramotores.",
                problema="La marca necesitaba una tienda online con configurador 3D, pagos internacionales y panel administrativo robusto.",
                solucion="Desarrollamos una plataforma completa con catalogo, carrito, checkout Stripe, CMS de contenidos y dashboard admin.",
                stack="Next.js, React, FastAPI, PostgreSQL, Redis, Stripe",
                resultado="Lanzamiento exitoso con arquitectura escalable y experiencia de compra premium.",
                url_externa="https://www.wingconcept.com",
                destacado=True,
                orden=1,
            ),
        ]
        db.add_all(portfolio)

        servicios = [
            Servicio(slug="desarrollo-web", titulo="Desarrollo web", descripcion="Sitios y aplicaciones web a medida con arquitectura moderna, rendimiento y SEO.", icono="globe", orden=1),
            Servicio(slug="apps-medida", titulo="Apps a medida", descripcion="Aplicaciones moviles y de escritorio adaptadas a procesos reales de tu negocio.", icono="smartphone", orden=2),
            Servicio(slug="backend-apis", titulo="Backend y APIs", descripcion="APIs REST robustas, integraciones y microservicios con PostgreSQL y Redis.", icono="server", orden=3),
            Servicio(slug="automatizacion", titulo="Automatizacion", descripcion="Flujos automatizados, scripts y pipelines que eliminan trabajo repetitivo.", icono="workflow", orden=4),
            Servicio(slug="mantenimiento", titulo="Mantenimiento", descripcion="Soporte continuo, actualizaciones de seguridad y evolucion de productos digitales.", icono="shield", orden=5),
        ]
        db.add_all(servicios)

        about = [
            AboutSection(titulo="Nuestra historia", contenido="ZomiDev nacio como un estudio boutique enfocado en software de calidad. Nuestro slogan — el lujo del detalle — guia cada decision de diseno, codigo y entrega.", orden=1),
            AboutSection(titulo="Filosofia de trabajo", contenido="Trabajamos con metodologia transparente, entregas iterativas y comunicacion constante. Creemos que el mejor software surge cuando cliente y equipo comparten visibilidad total del avance.", orden=2),
        ]
        db.add_all(about)

        contact = [
            ContactInfo(clave="calendario", valor="https://cal.com/zomidev", etiqueta="Agendar reunion"),
        ]
        db.add_all(contact)

        await db.commit()
        print("Seed completado.")
        print(f"Admin: {settings.SEED_ADMIN_EMAIL} / {settings.SEED_ADMIN_PASSWORD}")
        print(f"Cliente: {settings.SEED_CLIENT_EMAIL} / {settings.SEED_CLIENT_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
