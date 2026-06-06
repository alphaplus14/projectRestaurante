# Multi-tenant (módulo Master)

## Decisiones

- **Un subdominio por cliente:** `mi-local.tudominio.com`
- **Base de datos separada por cliente:** `rest_mi_local`
- **SMTP:** al invitar, se envía correo con el enlace de onboarding (fallback: copiar enlace en Master)

## Arquitectura

| BD | Contenido |
|----|-----------|
| `restaurante_master` | Tenants, invitaciones, usuarios master |
| `rest_{slug}` | Esquema completo del restaurante (clonado desde plantilla) |

## Puesta en marcha (local)

### 1. Plantilla de esquema

Importa `restaurante.sql` en MySQL como BD `restaurante` (o la que uses en `TENANT_TEMPLATE_DATABASE`).

### 2. Variables `.env` (backend)

```env
TENANCY_MODE=multi
TENANT_BASE_DOMAIN=localhost
TENANT_TEMPLATE_DATABASE=restaurante
DB_MASTER_DATABASE=restaurante_master
MASTER_ADMIN_EMAIL=master@local.test
MASTER_ADMIN_PASSWORD=master123
```

### 3. Migrar Master

```bash
cd backend
php artisan master:migrate --seed
```

### 4. Frontend (Vite)

En `frontend/.env` o `.env.local`:

```env
VITE_TENANT_BASE_DOMAIN=localhost
VITE_TENANT_PORT=5173
VITE_DEV_TENANT_SLUG=   # opcional si usas 127.0.0.1 sin subdominio
```

### 5. URLs locales

| Rol | URL |
|-----|-----|
| Master | http://master.localhost:5173/master/login |
| Onboarding | http://localhost:5173/onboarding/{token} |
| Cliente activo | http://{slug}.localhost:5173/cliente |

Chrome resuelve `*.localhost` sin editar `hosts`.

Si usas solo `127.0.0.1`, define `VITE_DEV_TENANT_SLUG=mi-slug` o guarda el slug en localStorage (`dev_tenant_slug`).

## SMTP (correo de invitación)

En `backend/.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-correo@gmail.com
MAIL_PASSWORD=contraseña-de-aplicacion
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=tu-correo@gmail.com
MAIL_FROM_NAME="Tu plataforma"
```

Prueba de envío:

```bash
php artisan mail:test cliente@ejemplo.com
```

**Gmail:** activa verificación en 2 pasos y crea una [contraseña de aplicación](https://myaccount.google.com/apppasswords).

Si SMTP falla, Master sigue mostrando el enlace para copiarlo manualmente.

## Flujo operativo (checklist)

### A. Preparación (una vez)

- [ ] `restaurante.sql` importado en MySQL como BD `restaurante` (plantilla).
- [ ] `php artisan master:migrate --seed`
- [ ] SMTP en `.env` (contraseña de aplicación **sin espacios** en `MAIL_PASSWORD`).
- [ ] `TENANT_FRONTEND_PORT=5173` para enlaces correctos en el correo.
- [ ] `TENANCY_MODE=multi` en backend `.env`.

### B. Alta de un cliente (flujo completo)

1. **Master** → http://master.localhost:5173/master/login  
2. Invitación: correo + slug (`mi-sushi`).  
3. Cliente recibe correo → abre `/onboarding/{token}`.  
4. **Onboarding en 3 pasos:** datos del local → usuario administrador → confirmar.  
5. Se crea BD `rest_mi_sushi` + admin; pantalla de éxito con checklist (panel, carta, personal, sitio público).  
6. Cliente entra en http://mi-sushi.localhost:5173/login-admin con el correo y contraseña que definió.  

### C. Desarrollo sin subdominio (opcional)

En `backend/.env` y `frontend/.env.local`:

```env
TENANT_DEFAULT_SLUG=mi-sushi
VITE_TENANT_DEFAULT_SLUG=mi-sushi
```

Así `127.0.0.1:5173` envía el header `X-Tenant-Slug` al API.

### D. Reenviar invitación

En Master, restaurantes en estado **pending**, **failed** o **provisioning** → botón **Reenviar correo** (genera enlace nuevo).

## Flujo resumido

1. Master crea invitación → correo SMTP.  
2. Cliente configura onboarding → BD dedicada.  
3. Opera en `{slug}.tudominio.com` (o `{slug}.localhost:5173` en local).

## Producción

- DNS wildcard: `*.tudominio.com` → servidor de la app.
- `TENANT_BASE_DOMAIN=tudominio.com`
- Usuario MySQL con permiso `CREATE DATABASE`.
- `php artisan storage:link` para logos por tenant.

## Modo legacy

`TENANCY_MODE=single` mantiene el comportamiento anterior (una sola BD, sin subdominio).
