"""
Actualiza portafolio y datos de contacto en BD existente.
Ejecutar: python -m scripts.update_content
"""
import asyncio

from sqlalchemy import delete, select

from app.database import AsyncSessionLocal, engine
from app.models.contacto import ContactInfo
from app.models.portafolio import PortafolioItem


async def update() -> None:
    if engine is None:
        raise RuntimeError("DATABASE_URL no configurada")

    async with AsyncSessionLocal() as db:
        await db.execute(
            delete(PortafolioItem).where(PortafolioItem.slug.in_(["vehiculos-app", "arango"]))
        )

        wing = await db.scalar(select(PortafolioItem).where(PortafolioItem.slug == "wingconcept"))
        if wing:
            wing.destacado = True
            wing.activo = True
            wing.orden = 1
        else:
            db.add(PortafolioItem(
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
            ))

        await db.execute(delete(ContactInfo).where(ContactInfo.clave.in_(["email", "telefono", "ubicacion"])))

        cal = await db.scalar(select(ContactInfo).where(ContactInfo.clave == "calendario"))
        if not cal:
            db.add(ContactInfo(clave="calendario", valor="https://cal.com/zomidev", etiqueta="Agendar reunion"))

        await db.commit()
        print("Contenido actualizado: portafolio y contacto.")


if __name__ == "__main__":
    asyncio.run(update())
