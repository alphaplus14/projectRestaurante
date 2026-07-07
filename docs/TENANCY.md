# Multi-tenant (módulo Master)

<<<<<<< HEAD
=======
> Migraciones: ver [MIGRATIONS.md](./MIGRATIONS.md) (flujo único master / plantilla / tenants).

>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
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

### 3b. Parches en tenants ya existentes

Tras actualizar el código, aplica migraciones pendientes en **todas** las BD `rest_*`:

```bash
cd backend
php artisan tenants:migrate-patches
# o solo un cliente:
php artisan tenants:migrate-patches --slug=chispa
```

Si el panel admin devuelve **500** en `/api/admin/dashboard` o `/api/admin/ventas/notificaciones`, suele faltar la migración `add_estado_cancelacion_to_venta` en ese tenant.

### Esquema plantilla (`restaurante.sql`)

Debe mantenerse al día con `database/migrations/tenant_patches/`. Tras la Fase 4 P0 incluye, entre otros:

| Elemento | Uso |
|----------|-----|
| `usuario.google_id` | OAuth Google cliente |
| `usuario.two_factor_*` | 2FA admin |
| `pedido_detalle.cancelado_*` | Cancelación de ítems en cocina |
| `producto_estado_log` | Alertas menú cocina → mesero |
| `producto.imagen` | Fotos en carta |

Los tenants **nuevos** se clonan de la plantilla y luego ejecutan `tenant_patches`. Los **existentes** solo necesitan `tenants:migrate-patches`.

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

El frontend **redirige** si abres Master u onboarding desde el subdominio equivocado (`RequireMasterHost`, `RequireOnboardingHost`).

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
6. Cliente entra en http://mi-sushi.localhost:5173/staff?rol=admin con el correo y contraseña que definió.  

### C. Desarrollo sin subdominio (opcional)

En `backend/.env` y `frontend/.env.local`:

```env
TENANT_DEFAULT_SLUG=mi-sushi
VITE_TENANT_DEFAULT_SLUG=mi-sushi
```

Así `127.0.0.1:5173` envía el header `X-Tenant-Slug` al API.

**Producción:** `X-Tenant-Slug` y `?tenant=` solo funcionan en entornos `local` / `testing`. En `production` el tenant **debe** resolverse por subdominio (`mi-sushi.tudominio.com`).

### D. Reenviar invitación

En Master, restaurantes en estado **pending**, **failed** o **provisioning** → botón **Reenviar correo** (genera enlace nuevo).

### E. Licencia y acceso (Master)

| Acción | Efecto |
|--------|--------|
<<<<<<< HEAD
| **+N meses** | Extiende `access_expires_at`; reactiva si estaba `suspended` |
| **Desactivar acceso** | `status = suspended` → API del restaurante responde 403 |

Variables:

```env
# Meses al completar onboarding (0 = sin vencimiento)
TENANT_DEFAULT_LICENSE_MONTHS=1
```

Clientes antiguos pueden tener `access_expires_at` null (sin límite) hasta que Master asigne meses.

Más contexto: [ROADMAP.md](./ROADMAP.md), [AUTH.md](./AUTH.md).
=======
| **Nueva invitación** | Master define `license_months` (1–36). Al completar onboarding se activa `access_expires_at` con esos meses |
| **+N meses** | Extiende `access_expires_at`; reactiva si estaba `suspended` o con cancelación programada |
| **Desactivar acceso** | Si hay licencia vigente: marca `access_cancel_at_period_end` — el cliente **sigue entrando hasta** `access_expires_at`; luego se suspende solo. Sin fecha de vencimiento: suspensión inmediata |
| **Reactivar suscripción** | Solo el Master, extendiendo meses tras el pago (quita cancelación programada) |

### F. Renovación con Nequi (semi-automática)

Guía completa (pantallas, API, prueba local, tests): **[BILLING_RENEWAL.md](./BILLING_RENEWAL.md)**.

Resumen:

1. **Master → Ajustes:** llave/QR Nequi y precios fijos por paquete (1 / 3 / 6 / 12 meses).
2. **Admin → Configuración** (`/admin/configuracion#suscripcion`): paga por Nequi, **Notificar pago** con referencia (mín. 3 caracteres).
3. **Master → Pagos:** **Confirmar pago** o **Rechazar**. Al confirmar, `extendAccessByMonths()` actualiza `access_expires_at`.

| Rol | URL local |
|-----|-----------|
| Master ajustes / pagos | http://master.localhost:5173/master/dashboard |
| Admin renovación | http://{slug}.localhost:5173/admin/configuracion#suscripcion |

Reglas clave: **una solicitud `pending` por restaurante**; sin webhook Nequi; banner de aviso cuando faltan ≤ `TENANT_LICENSE_WARNING_DAYS` (default 7).

Migraciones master necesarias: `platform_billing_settings`, `subscription_renewal_requests` (`php artisan master:migrate`).

Más contexto: [AUTH.md](./AUTH.md), [ROADMAP.md](./ROADMAP.md).
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235

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
