# Despliegue ZomiDev — Guía completa

Repo: [github.com/Aledmc12/Zomidev](https://github.com/Aledmc12/Zomidev)

Stack en producción: **Next.js 15 + FastAPI + Supabase + Redis + Nginx + Cloudflare**

---

## ⚠️ Seguridad inmediata

Si compartiste contraseñas o API keys en chat, correos o tickets, **cámbialas ahora**:

1. **Supabase** → Settings → Database → Reset database password  
2. **Resend** → API Keys → Revocar la anterior → Crear nueva  
3. Genera un `SECRET_KEY` nuevo: `openssl rand -hex 32`  
4. Genera un `REDIS_PASSWORD` nuevo: `openssl rand -base64 32`

Nunca subas `.env`, `.env.production` ni `docker/.env` a GitHub.

---

## Arquitectura (VPS con 2 sitios)

```
Internet
   │
   ▼
Cloudflare (DNS + WAF + bots + SSL edge)
   │
   ▼
VPS — Nginx (multi-site por server_name)
   ├── tu-sitio-existente.com  → 127.0.0.1:PUERTO_A   (sin cambios)
   └── zomidev.com             → 127.0.0.1:3010       (Docker frontend)
                                        │
                                        ├─► backend:8000 (Docker, red interna)
                                        ├─► redis (Docker, red interna)
                                        └─► Supabase PostgreSQL (externo)
```

ZomiDev **no compite** con tu otro sitio: cada dominio tiene su propio bloque `server` en Nginx y su propio puerto local.

---

## Fase 1 — GitHub y branches

### Branches

| Branch | Uso |
|--------|-----|
| `main` | Producción → zomidev.com |
| `develop` | Staging / integración |
| `feature/*` | Desarrollo → PR a `develop` |

### Subir código (primera vez)

```bash
cd /Users/alecito/PycharmProjects/ZomiDev

git init
git remote add origin https://github.com/Aledmc12/Zomidev.git

git checkout -b develop
git add .
git commit -m "Initial commit: ZomiDev production-ready stack"
git push -u origin develop

git checkout -b main
git push -u origin main
```

En GitHub → **Settings → Branches** → proteger `main`:
- Require pull request
- Require status checks (CI)

---

## Fase 2 — Supabase (base de datos)

### 2.1 Connection string

En Supabase → **Project Settings → Database → Connection string → URI**

Añade siempre SSL:

```
postgresql://postgres:TU_PASSWORD@db.clowsffrfsxxbvrytppv.supabase.co:5432/postgres?sslmode=require
```

> Para muchas conexiones concurrentes, usa el **pooler** (puerto 6543) en lugar de 5432.

### 2.2 Migraciones (desde tu Mac, una vez)

```bash
cd backend
cp .env.example .env

# Edita DATABASE_URL con tu URI de Supabase + sslmode=require
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

### 2.3 Seed inicial (solo primera vez)

```bash
SEED_ADMIN_PASSWORD='TuPasswordSegura123!' \
SEED_CLIENT_PASSWORD='OtraPasswordSegura456!' \
python -m scripts.seed_data
```

---

## Fase 3 — Cloudflare (DNS + bots + WAF)

### 3.1 Añadir dominio

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Add site** → `zomidev.com`
2. Plan Free es suficiente para empezar
3. Cloudflare te da 2 nameservers → cámbialos en tu registrador de dominio
4. Espera propagación (5–30 min)

### 3.2 DNS

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| A | `@` | IP de tu VPS | Proxied (naranja) |
| A | `www` | IP de tu VPS | Proxied |
| CNAME | `www` | `zomidev.com` | Proxied *(alternativa)* |

### 3.3 SSL/TLS

**SSL/TLS → Overview → Full (strict)**

- Cloudflare termina TLS hacia el usuario
- Nginx en el VPS también necesita certificado válido (Let's Encrypt)

**Edge Certificates:**
- Always Use HTTPS: **On**
- Minimum TLS Version: **1.2**
- Automatic HTTPS Rewrites: **On**

### 3.4 Control de bots

**Security → Bots**

| Opción | Recomendación |
|--------|---------------|
| Bot Fight Mode | **On** (plan Free) |
| Super Bot Fight Mode | On si tienes Pro |
| Block AI bots | On (opcional) |

**Security → Settings**

- Security Level: **Medium** o **High**
- Challenge Passage: 30 minutos

**Security → WAF → Custom rules** (plan Free: 5 reglas)

Regla 1 — Proteger login:
```
(http.request.uri.path contains "/login" or http.request.uri.path contains "/api/v1/auth/login")
and cf.threat_score gt 10
→ Managed Challenge
```

Regla 2 — Bloquear scanners en rutas privadas:
```
(http.request.uri.path contains "/admin" or http.request.uri.path contains "/portal")
and not cf.client.bot_management.verified_bot
and cf.threat_score gt 20
→ Block
```

Regla 3 — Rate limit contacto *(requiere plan Pro o usar regla básica)*:
```
http.request.uri.path eq "/api/v1/public/contact"
→ Rate limit 10 req/min por IP
```

**Security → Turnstile** (CAPTCHA invisible, recomendado para contacto):

1. Crear widget → modo **Managed**
2. Dominios: `zomidev.com`
3. Guardar **Site Key** y **Secret Key** para integración futura en el formulario de contacto

Por ahora el formulario ya tiene **honeypot** + rate limit en backend; Turnstile es capa extra.

### 3.5 Headers y caché

**Rules → Configuration Rules** o **Page Rules**:

- `/admin/*`, `/portal/*`, `/login`, `/api/v1/*` → **Cache Level: Bypass**
- Assets estáticos `/_next/static/*` → Cache Everything, TTL 1 mes

**Speed → Optimization**

- Brotli: On
- Auto Minify: CSS + JS

---

## Fase 4 — VPS (conviviendo con tu sitio actual)

### 4.1 Verificar puertos libres

```bash
# Qué usa Nginx actualmente
sudo nginx -T | grep -E "server_name|proxy_pass|listen"

# Puertos en uso
sudo ss -tlnp | grep -E ':80|:443|:3000|:3010'
```

Si **3010 está ocupado**, cambia `ZOMIDEV_FRONTEND_PORT` en `docker/.env` y el `proxy_pass` en `docker/nginx/zomidev*.conf`.

### 4.2 Instalar dependencias (si no las tienes)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
# Cierra sesión y vuelve a entrar
```

### 4.3 Clonar ZomiDev (sin tocar el otro sitio)

```bash
sudo mkdir -p /opt/zomidev
sudo chown $USER:$USER /opt/zomidev
cd /opt/zomidev
git clone https://github.com/Aledmc12/Zomidev.git app
cd app
git checkout main
```

### 4.4 Variables de entorno en el VPS

```bash
# Docker
cp docker/.env.example docker/.env
nano docker/.env
# REDIS_PASSWORD=...
# NEXT_PUBLIC_SITE_URL=https://zomidev.com
# ZOMIDEV_FRONTEND_PORT=3010

# Backend
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
# Completa SECRET_KEY, DATABASE_URL, REDIS_PASSWORD, RESEND_API_KEY, etc.
```

### 4.5 Levantar ZomiDev

```bash
cd /opt/zomidev/app/docker
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml logs -f
```

Verifica localmente:
```bash
curl -I http://127.0.0.1:3010
```

### 4.6 Nginx — añadir ZomiDev sin modificar el otro sitio

Usa la plantilla **HTTP inicial** (`zomidev.initial.conf`). La plantilla con SSL (`zomidev.conf`) requiere certificados que aún no existen — Nginx fallará con `options-ssl-nginx.conf: No such file`.

```bash
sudo mkdir -p /var/www/html

# Copia la plantilla HTTP (proxy → 127.0.0.1:3010)
sudo cp /opt/zomidev/app/docker/nginx/zomidev.initial.conf /etc/nginx/sites-available/zomidev

sudo ln -sf /etc/nginx/sites-available/zomidev /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Tu sitio existente sigue en su propio archivo (`/etc/nginx/sites-enabled/otro-sitio`). Nginx enruta por `server_name`.

### 4.7 Certificado HTTPS (Let's Encrypt)

Con Nginx en HTTP funcionando:

```bash
sudo certbot --nginx -d zomidev.com -d www.zomidev.com \
  --redirect --agree-tos -m tu@email.com
sudo certbot renew --dry-run
```

Certbot crea los certificados y añade el bloque HTTPS. Opcional: sustituye por `zomidev.conf` (headers extra) **después** de Certbot:

```bash
sudo cp /opt/zomidev/app/docker/nginx/zomidev.conf /etc/nginx/sites-available/zomidev
sudo nginx -t && sudo systemctl reload nginx
```

Con Cloudflare en **Full (strict)**, el origen (VPS) debe tener certificado válido — Certbot lo resuelve.

---

## Fase 5 — Verificación de autenticación

El proyecto **ya migró** de localStorage a cookies HttpOnly. Estado actual:

| Capa | Estado | Detalle |
|------|--------|---------|
| Backend login | ✅ | Cookies `access_token`, `refresh_token`, `zomidev_role` — HttpOnly, Secure (prod), SameSite=Lax |
| JSON de login | ✅ | Solo devuelve `{ user }`, **sin tokens** en el body |
| Frontend API | ✅ | `credentials: 'include'` + refresh automático en 401 |
| Middleware Next.js | ✅ | Bloquea `/admin` y `/portal` sin cookie `access_token` |
| Rate limit login | ✅ | Redis: 10 intentos/15 min por IP+email |
| Datos de usuario UI | ✅ | Solo en `sessionStorage` (no tokens) |

### Pruebas post-deploy

```bash
# 1. Sin cookie → redirect a login
curl -I https://zomidev.com/admin

# 2. Login
curl -c cookies.txt -X POST https://zomidev.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zomidev.com","password":"TU_PASSWORD"}'

# 3. Con cookie → acceso
curl -b cookies.txt https://zomidev.com/api/v1/auth/me

# 4. Logout limpia cookies
curl -b cookies.txt -X POST https://zomidev.com/api/v1/auth/logout
```

En el navegador (DevTools → Application → Cookies):
- Debes ver `access_token`, `refresh_token`, `zomidev_role`
- Flags: **HttpOnly ✓**, **Secure ✓**, **SameSite: Lax**
- **No** debe haber tokens en localStorage

---

## Fase 6 — Robots, sitemap, SEO

Ya implementados — no requieren archivos extra:

| URL | Archivo |
|-----|---------|
| `/robots.txt` | `frontend/app/robots.js` |
| `/sitemap.xml` | `frontend/app/sitemap.js` |

Requisito: `NEXT_PUBLIC_SITE_URL=https://zomidev.com` en el build.

Verificar:
```bash
curl https://zomidev.com/robots.txt
curl https://zomidev.com/sitemap.xml
```

Google Search Console → añadir propiedad → enviar sitemap.

---

## Fase 7 — Redis (seguro)

Redis en producción:
- ✅ Contraseña fuerte (`REDIS_PASSWORD`)
- ✅ Solo red Docker interna (sin `ports:` al host)
- ✅ No expuesto a internet
- ❌ No necesita certificado TLS (tráfico solo dentro del VPS)

---

## Fase 8 — Actualizar producción

```bash
ssh tu-usuario@TU_VPS
cd /opt/zomidev/app
git pull origin main
cd docker
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker image prune -f
```

---

## Checklist final de seguridad

- [ ] Contraseñas de Supabase y Resend rotadas
- [ ] `SECRET_KEY` y `REDIS_PASSWORD` únicos y fuertes
- [ ] `ENVIRONMENT=production`, `DEBUG=False`
- [ ] `SEED_ADMIN_PASSWORD` cambiada respecto al default
- [ ] Cloudflare proxy activo (nube naranja en DNS)
- [ ] SSL Full (strict) en Cloudflare + Let's Encrypt en VPS
- [ ] Bot Fight Mode activo
- [ ] Redis sin puerto público
- [ ] Backend sin puerto público (solo frontend en 127.0.0.1)
- [ ] `/docs` API deshabilitado en producción
- [ ] Login probado con cookies HttpOnly
- [ ] Otro sitio en el VPS sigue funcionando

---

## Solución de problemas

**502 Bad Gateway**
→ `docker compose logs frontend` — verifica que el contenedor esté arriba y el puerto en nginx coincida.

**Error de DB / SSL**
→ Añade `?sslmode=require` al `DATABASE_URL`.

**Rate limit siempre bloquea**
→ Verifica `TRUSTED_PROXY_HOSTS=127.0.0.1` y que Nginx pase `CF-Connecting-IP`.

**Cookies no se guardan**
→ Cloudflare SSL debe ser Full (strict); `ENVIRONMENT=production` en backend; dominio debe ser HTTPS.

**Conflicto de puerto con otro sitio**
→ Cambia `ZOMIDEV_FRONTEND_PORT` en `docker/.env` y en nginx.

**ZomiDev aparece en WingConcept (o al revés)**
→ Ambos proyectos tenían el mismo nombre Docker Compose (`docker`) porque viven en carpetas `docker/`. Al hacer `up` en ZomiDev se recreaban contenedores de WingConcept. Solución:
```bash
# WingConcept — siempre desde su carpeta, con proyecto explícito:
cd /opt/wingconcept/docker
docker compose -p wingconcept up -d

# ZomiDev — usa docker-compose.prod.yml (incluye name: zomidev):
cd /opt/zomidev/app/docker
docker compose -f docker-compose.prod.yml --env-file .env up -d
```
Nunca ejecutes `docker compose up` en ZomiDev sin `-f docker-compose.prod.yml`.

---

## Contacto / soporte

- Repo: https://github.com/Aledmc12/Zomidev
- Dominio: zomidev.com
