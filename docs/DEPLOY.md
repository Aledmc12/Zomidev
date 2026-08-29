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
VPS — wingconcept_nginx (80/443, multi-site por server_name)
   ├── wingconcept.com  → frontend WingConcept (Docker interno)
   └── zomidev.com      → 172.17.0.1:8080 (docker0, NO 127.0.0.1)
                                    │
                                    ▼
                          zomidev_nginx (Docker, puerto 8080)
                                    │
                                    ├─► zomidev_frontend:3000
                                    ├─► zomidev_backend:8000
                                    ├─► zomidev_redis
                                    └─► Supabase PostgreSQL (externo)
```

ZomiDev tiene **su propio nginx** (`zomidev_nginx`). WingConcept solo añade un bloque mínimo que reenvía `zomidev.com` al puerto **8080**.

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

En Supabase → **Project Settings → Database → Connection string**.

**En el VPS (Contabo, sin IPv6)** no uses la conexion **Direct** (`db.xxx.supabase.co`): solo tiene IPv6 y falla con `Network is unreachable`.

Usa **Session pooler** (Method: *Session pooler*, puerto **5432**):

```
postgresql://postgres.clowsffrfsxxbvrytppv:TU_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
```

- Usuario: `postgres.clowsffrfsxxbvrytppv` (incluye el project ref)
- Host: copialo tal cual del dashboard (`aws-0-REGION.pooler.supabase.com`)
- Password: la de **Database password** del proyecto (no la anon/service key)

Para desarrollo local en Mac (con IPv6) puedes usar Direct:

```
postgresql://postgres:TU_PASSWORD@db.clowsffrfsxxbvrytppv.supabase.co:5432/postgres?sslmode=require
```

> **Transaction pooler** (puerto 6543) es para serverless; para este backend usa **Session pooler** (5432).

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
sudo ss -tlnp | grep -E ':80|:443|:8080'
```

Si **8080 está ocupado**, cambia `ZOMIDEV_NGINX_PORT` en `docker/.env` y el `proxy_pass` en `docker/nginx/wingconcept-proxy.snippet.conf`.

### 4.2 Instalar dependencias (si no las tienes)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# Cierra sesión y vuelve a entrar
```

> **No instales nginx en el host** si WingConcept ya usa `wingconcept_nginx` en Docker (puertos 80/443).

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
# ZOMIDEV_NGINX_PORT=8080

# Backend
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
# Completa SECRET_KEY, DATABASE_URL, REDIS_PASSWORD, RESEND_API_KEY, etc.
```

### 4.5 Levantar ZomiDev

```bash
cd /opt/zomidev/app/docker
docker compose -p zomidev -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -p zomidev -f docker-compose.prod.yml ps
```

Verifica localmente:
```bash
curl -I http://127.0.0.1:8080
```

Debes ver contenedores `zomidev_nginx`, `zomidev_frontend`, `zomidev_backend`, `zomidev_redis` — **sin** mezclar `wingconcept_*`.

### 4.6 WingConcept — bloque mínimo para zomidev.com

Edita **solo una vez** el nginx de WingConcept. Copia el snippet del repo:

```bash
cat /opt/zomidev/app/docker/nginx/wingconcept-proxy.snippet.conf
nano /opt/wingconcept/docker/nginx/nginx.conf
```

Pega el bloque HTTP **dentro de** `http { ... }`, justo antes del `}` final. No modifiques los bloques de `wingconcept.com`.

Recarga nginx de WingConcept:

```bash
docker exec wingconcept_nginx nginx -t
docker exec wingconcept_nginx nginx -s reload
curl -I -H "Host: zomidev.com" http://127.0.0.1
```

Para cambios futuros de ZomiDev, edita `/opt/zomidev/app/docker/nginx/zomidev-standalone.conf` y reinicia solo ZomiDev:

```bash
docker compose -p zomidev -f docker-compose.prod.yml restart nginx
```

### 4.7 Certificado HTTPS para zomidev.com

Con el bloque HTTP funcionando:

```bash
docker exec wingconcept_certbot certbot certonly --webroot \
  -w /var/www/certbot \
  -d zomidev.com -d www.zomidev.com \
  --agree-tos -m tu@email.com
```

Descomenta y añade el bloque HTTPS del snippet (`wingconcept-proxy.snippet.conf`), recarga:

```bash
docker exec wingconcept_nginx nginx -t && docker exec wingconcept_nginx nginx -s reload
```

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

**504 Gateway Timeout (Cloudflare) pero `curl 127.0.0.1:8080` funciona**
→ ZomiDev nginx estaba en `127.0.0.1:8080` y WingConcept (contenedor) no puede alcanzar el loopback del host. Usa `ZOMIDEV_NGINX_BIND=172.17.0.1` en `docker/.env` y recrea nginx:
```bash
ip -4 addr show docker0 | grep inet   # confirmar IP (suele ser 172.17.0.1)
# docker/.env → ZOMIDEV_NGINX_BIND=172.17.0.1
docker compose -p zomidev -f docker-compose.prod.yml up -d nginx
docker exec wingconcept_nginx wget -qO- --timeout=5 http://172.17.0.1:8080/ | head -c 100
```
→ Si accedes por **HTTPS**, descomenta el bloque HTTPS en `wingconcept-proxy.snippet.conf` y obtén certificado con certbot.

**502 Bad Gateway**
→ `docker compose logs frontend` — verifica que el contenedor esté arriba y el puerto en nginx coincida.

**Error de DB / SSL**
→ Añade `?sslmode=require` al `DATABASE_URL`.

**Rate limit siempre bloquea**
→ Verifica `TRUSTED_PROXY_HOSTS=127.0.0.1` y que Nginx pase `CF-Connecting-IP`.

**Cookies no se guardan**
→ Cloudflare SSL debe ser Full (strict); `ENVIRONMENT=production` en backend; dominio debe ser HTTPS.

**Conflicto de puerto con otro sitio**
→ Cambia `ZOMIDEV_NGINX_PORT` en `docker/.env` y el `172.17.0.1:8080` en `wingconcept-proxy.snippet.conf`.

**ZomiDev aparece en WingConcept (o al revés)**
→ Ambos proyectos tenían el mismo nombre Docker Compose (`docker`) porque viven en carpetas `docker/`. Al hacer `up` en ZomiDev se recreaban contenedores de WingConcept. Solución:
```bash
# WingConcept — siempre desde su carpeta, con proyecto explícito:
cd /opt/wingconcept/docker
docker compose -p wingconcept up -d

# ZomiDev — usa docker-compose.prod.yml (incluye name: zomidev):
cd /opt/zomidev/app/docker
docker compose -p zomidev -f docker-compose.prod.yml --env-file .env up -d
```
Nunca ejecutes `docker compose up` en ZomiDev sin `-p zomidev` ni `-f docker-compose.prod.yml`.

---

## Contacto / soporte

- Repo: https://github.com/Aledmc12/Zomidev
- Dominio: zomidev.com
