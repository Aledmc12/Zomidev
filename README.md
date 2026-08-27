# ZomiDev

Sitio web oficial y portal de clientes para **ZomiDev** (zomidev.com). Estudio de desarrollo de software con identidad oscura, minimalista y acentos dorados.

## Stack

| Capa | Tecnologia |
|------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, Framer Motion, Zustand, Lucide |
| Backend | FastAPI, SQLAlchemy async, Alembic, JWT, Redis |
| Base de datos | PostgreSQL (local via Docker o Supabase en produccion) |

## Estructura del proyecto

```
ZomiDev/
├── backend/
│   └── app/              # API FastAPI (auth, public, portal, admin)
├── frontend/
│   ├── app/              # App Router (landing, portal, admin)
│   ├── components/       # UI reutilizable
│   ├── lib/              # Cliente API y utilidades
│   ├── context/          # Providers
│   └── store/            # Zustand
├── docker/               # PostgreSQL + Redis para desarrollo local
└── README.md
```

## Requisitos previos

- Node.js 20+
- Python 3.11+ (3.14 compatible)
- Docker y Docker Compose

## 1. Infraestructura local

```bash
cd docker
docker compose up -d
```

Servicios:

- PostgreSQL: `localhost:5432` (usuario/clave/db: `zomidev`)
- Redis: `localhost:6379`

## 2. Backend

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed_data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

> **Nota:** Si tienes WingConcept u otro backend en el puerto 8000, usa **8001** para ZomiDev y configura `NEXT_PUBLIC_API_URL=http://localhost:8001` en `frontend/.env.local`.

Variables clave en `backend/.env`:

| Variable | Descripcion |
|----------|-------------|
| `SECRET_KEY` | Clave JWT (min. 32 chars). Generar: `openssl rand -hex 32` |
| `DATABASE_URL` | Connection string PostgreSQL |
| `ALLOWED_ORIGINS` | Origenes CORS (frontend) |
| `FRONTEND_URL` | URL del frontend para enlaces |

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Credenciales de demo (seed)

| Rol | Email | Contrasena |
|-----|-------|------------|
| Admin | admin@zomidev.com | Admin123! |
| Cliente | cliente@ejemplo.com | Cliente123! |

## Rutas principales

### Sitio publico

- `/` — Landing
- `/servicios` — Servicios
- `/portafolio` — Casos de exito
- `/nosotros` — Historia y equipo
- `/contacto` — Formulario de contacto

### Portal de clientes

- `/login` — Autenticacion
- `/portal` — Dashboard
- `/portal/proyectos/[id]` — Detalle con timeline, previews, entregables y bitacora
- `/portal/mensajes` — Comunicacion con el equipo
- `/portal/notificaciones` — Avisos de avance

### Panel admin

- `/admin` — Estadisticas
- `/admin/proyectos` — Gestion de proyectos
- `/admin/proyectos/[id]` — Actualizar progreso, hitos y bitacora
- `/admin/clientes` — Crear clientes

## API

Documentacion interactiva en desarrollo: [http://localhost:8000/docs](http://localhost:8000/docs)

Prefijo: `/api/v1`

- `POST /auth/login` — Login JWT
- `GET /public/portfolio` — Portafolio publico
- `GET /portal/dashboard` — Dashboard cliente (auth)
- `PATCH /admin/projects/{id}` — Actualizar proyecto (admin)

## Produccion

1. Configurar `ENVIRONMENT=production` en backend
2. Usar PostgreSQL gestionado (Supabase recomendado)
3. Configurar `ALLOWED_HOSTS`, `ALLOWED_ORIGINS`, `FRONTEND_URL` con dominio real
4. Build frontend: `npm run build && npm start`
5. Servir backend con Uvicorn/Gunicorn detras de Nginx

## Equipo

ZomiDev — Desarrollo de software con precision y calma.
