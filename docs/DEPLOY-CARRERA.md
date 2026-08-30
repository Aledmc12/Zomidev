# Despliegue CarreraApp — app.carreraarango.com

App web de formularios de vehículos (paridad con la app móvil React Native).  
Stack: **Next.js 15 + Supabase (auth + DB + Edge Functions) + Nginx + Cloudflare**.

> **Importante:** CarreraApp usa el **proyecto Supabase de Carrera Arango** (mismo que la app móvil), **no** el de ZomiDev (`clowsffrfsxxbvrytppv`).

---

## Arquitectura (VPS con 3 sitios)

```
Internet
   │
   ▼
Cloudflare (DNS proxy + Bot Fight + WAF + rate rules)
   │
   ▼
VPS — wingconcept_nginx (80/443, multi-site por server_name)
   ├── wingconcept.com         → WingConcept (Docker interno)
   ├── zomidev.com             → 172.17.0.1:8080 (ZomiDev)
   └── app.carreraarango.com   → 172.17.0.1:8081 (CarreraApp)
                                        │
                                        ▼
                              carrera_nginx (Docker, puerto 8081)
                                        │
                                        └─► carrera_frontend:3000
                                                │
                                                └─► Supabase Carrera (externo)
```

CarreraApp tiene **su propio compose** (`docker-compose.carrera.yml`) y **su propio nginx** con rate limiting. WingConcept solo añade un bloque que reenvía el subdominio al puerto **8081**.

---

## Seguridad (capas)

| Capa | Qué protege | Configuración |
|------|-------------|---------------|
| **Cloudflare** | Bots, DDoS L3/L7, escaneo | Proxy naranja, Bot Fight Mode, WAF, rate limiting |
| **WingConcept nginx** | Terminación SSL, proxy | Solo reenvío; no exponer 8081 al público |
| **carrera_nginx** | Abuso por IP | `limit_req` login 5/min, general 30/s, `limit_conn` 20 |
| **Next.js** | XSS, clickjacking, CSP | Cabeceras en `next.config.ts` + `middleware.ts` |
| **App (cliente)** | Fuerza bruta login | `lib/security/rateLimit.ts` — 8 intentos / 15 min |
| **Supabase** | Datos y auth | RLS en tabla `formularios`, anon key solo en cliente |
| **robots / SEO** | Indexación | `robots: noindex`, `public/robots.txt` Disallow |

### Cloudflare (recomendado)

1. Añadir registro DNS `app` → IP del VPS, **proxy activado** (nube naranja).
2. **SSL/TLS** → Full (strict) tras certificado Let's Encrypt en el VPS.
3. **Security → Bots** → Bot Fight Mode: **On**.
4. **Security → WAF** → Managed rules: activar OWASP y Cloudflare Managed.
5. **Security → Rate limiting** (ejemplos):
   - `/login` — 10 req/min por IP → Block 10 min
   - `/*` — 100 req/min por IP → Challenge o Block
6. **Caching** → Bypass cache en `/login`, `/formulario`, rutas con cookies Supabase (`Cache Level: Bypass` rule).
7. **Firewall** → bloquear países no necesarios si aplica (opcional).

### Nginx interno (ya en repo)

Archivos:

- `docker/nginx/carrera-rate-limit.conf` — zonas `limit_req` y `limit_conn`
- `docker/nginx/carrera-standalone.conf` — proxy a frontend + cabeceras

Límites por defecto:

- Login: **5 req/min** por IP (+ burst 10)
- Resto: **30 req/s** por IP (+ burst 50)
- Conexiones simultáneas: **20** por IP

### Supabase

- Verificar **RLS** en `formularios`: solo el `user_id` autenticado puede insertar/leer sus registros.
- Edge Function `generar-pdf-email`: validar JWT en la función.
- **No** usar service role key en el frontend.

---

## Variables de entorno

### En el VPS: `docker/.env.carrera`

```bash
cd /opt/zomidev/app/docker   # o donde clones el repo
cp .env.carrera.example .env.carrera
nano .env.carrera
```

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase Carrera |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (misma que app móvil) |
| `NEXT_PUBLIC_SHEETS_WEBHOOK_URL` | Webhook Google Sheets (opcional) |
| `NEXT_PUBLIC_SITE_URL` | `https://app.carreraarango.com` |
| `CARRERA_NGINX_BIND` | `172.17.0.1` (accesible desde WingConcept nginx) |
| `CARRERA_NGINX_PORT` | `8081` |

> Nunca subas `.env.carrera` ni keys a GitHub.

---

## Despliegue en VPS

### 1. Código en el servidor

```bash
cd /opt/zomidev/app
git pull origin develop   # o la rama que uses
```

### 2. Build y arranque CarreraApp

```bash
cd docker
docker compose -p carrera -f docker-compose.carrera.yml --env-file .env.carrera up -d --build
```

Verificar:

```bash
docker compose -p carrera ps
docker compose -p carrera logs nginx --tail 30
docker compose -p carrera logs frontend --tail 30
ss -tlnp | grep 8081 || netstat -tlnp | grep 8081
curl -s -o /dev/null -w "%{http_code}" http://172.17.0.1:8081/login
# Esperado: 200
```

### Si `curl: (7) Failed to connect to 172.17.0.1 port 8081`

1. **El stack no está levantado** — ejecuta el `docker compose ... up -d --build` de arriba.
2. **Falta `.env.carrera`** — el build necesita `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Nginx no arrancó** — revisa logs; las directivas `limit_req_zone` deben estar en `00-rate-limit.conf` (no dentro del bloque `server`).
4. **Estás en tu Mac local** — `172.17.0.1` solo funciona en el **VPS Linux** con Docker; en local usa `curl http://127.0.0.1:8081/login` tras `CARRERA_NGINX_BIND=127.0.0.1`.

### 3. WingConcept nginx — proxy subdominio

Añadir el bloque de `docker/nginx/wingconcept-carrera-proxy.snippet.conf` dentro de `http { }` en  
`/opt/wingconcept/docker/nginx/nginx.conf` (junto al bloque de zomidev.com).

Recargar:

```bash
cd /opt/wingconcept/docker
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

### 4. DNS

En Cloudflare (dominio `carreraarango.com`):

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| A | app | IP_VPS | Proxied |

### 5. HTTPS (certbot)

```bash
# Desde el contenedor/host donde corre certbot de WingConcept
certbot certonly --webroot -w /var/www/certbot \
  -d app.carreraarango.com

# Descomentar bloque HTTPS en wingconcept nginx para app.carreraarango.com
# Recargar nginx
```

---

## Desarrollo local

```bash
cd carrera-app
cp .env.production.example .env.local
# Editar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev    # http://localhost:3001
```

Build de producción:

```bash
npm run build && npm start
```

---

## Actualización / rollback

```bash
cd /opt/zomidev/app
git pull
cd docker
docker compose -p carrera -f docker-compose.carrera.yml --env-file .env.carrera up -d --build
```

Rollback: `git checkout <commit-anterior>` y repetir el compose.

---

## Checklist post-despliegue

- [ ] `https://app.carreraarango.com/login` carga con logo y formulario
- [ ] Login con usuario de prueba Supabase → redirige a `/formulario`
- [ ] Guardar formulario de ingreso → fila en Supabase `formularios`
- [ ] Envío PDF/email (Edge Function) funciona con sesión activa
- [ ] Cloudflare Bot Fight activo; SSL Full (strict)
- [ ] Rate limit: muchas peticiones a `/login` devuelven 503/429 (nginx o CF)
- [ ] ZomiDev y WingConcept siguen operativos (puertos 8080 y 8081 distintos)

---

## Puertos en el VPS

| Servicio | Bind | Puerto host | Uso |
|----------|------|-------------|-----|
| ZomiDev nginx | 172.17.0.1 | 8080 | zomidev.com |
| Carrera nginx | 172.17.0.1 | 8081 | app.carreraarango.com |
| WingConcept | 0.0.0.0 | 80/443 | Entrada pública |

---

## Soporte

Desarrollado por [ZomiDev](https://zomidev.com). Para incidencias de infraestructura, revisar logs:

```bash
docker compose -p carrera logs -f frontend
docker compose -p carrera logs -f nginx
```
