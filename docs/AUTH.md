# Autenticación y sesiones

Resumen de cómo se autentica cada actor en el sistema (Fase 1 documentada).

---

## Tres mundos separados

| Actor | URL entrada | Token (localStorage) | API prefix |
|-------|-------------|----------------------|------------|
| **Master** (proveedor) | `master.{domain}/master/login` | `master_api_token` | `/api/master/*` |
| **Staff / Cliente** (tenant) | `{slug}.{domain}/staff` o `/cliente/login` | `restaurante_token` | `/api/auth/*`, `/api/{rol}/*` |
| **Onboarding** | `/onboarding/{token}` | — (sin sesión) | `/api/master/onboarding/*` |

El middleware `IdentifyTenant` corre **antes** que Sanctum en rutas del restaurante. Sin tenant válido no hay login.

---

## Login staff (unificado)

Página: `/staff?rol=mesero|admin|cocina|cajero`

| Rol | Endpoint | Guard frontend |
|-----|----------|----------------|
| Mesero | `POST /api/auth/login-mesero` | `RequireMesero` |
| Cocina | `POST /api/auth/login-cocina` | `RequireCocina` |
| Cajero | `POST /api/auth/login-cajero` | `RequireCajero` |
| Admin | `POST /api/auth/login-admin` | `RequireAdmin` |

**Importante:** `POST /api/auth/login` (genérico) **rechaza** cuentas `ADMINISTRADOR` con 403. El admin no puede saltarse el flujo `login-admin` + 2FA emitiendo token por el endpoint genérico.

Redirects legacy: `/login-admin` → `/staff?rol=admin`, etc.

**Un token por navegador:** `restaurante_token` es compartido; iniciar sesión con otro rol sobrescribe la sesión anterior.

**Cerrar sesión:** `logoutTenantSession()` (frontend) llama `POST /api/auth/logout` y borra el token local. Usado en staff, cliente y admin.

**Usuario desactivado:** al poner `activo = false` desde el panel admin se revocan todos los tokens Sanctum de ese usuario. `RoleMiddleware` también rechaza cuentas inactivas con 403.

---

## Admin: 2FA y contraseña

1. `POST /api/auth/login-admin` con correo y contraseña.
2. Si 2FA activo → respuesta `{ two_factor: true, challenge_token }` (sin token aún).
3. `POST /api/auth/two-factor-challenge` con código TOTP o recovery → token Sanctum.

Gestión 2FA (logueado como admin):

- `GET/POST/DELETE /api/admin/two-factor/*` (enable, confirm, recovery, disable).

Reset contraseña (Fortify, sin sesión web):

- `POST /api/auth/forgot-password` → correo con enlace al subdominio del tenant.
- `POST /api/auth/reset-password` con token + correo.

---

## Rate limiting (Fase 1)

| Limiter | Rutas | Clave | Config |
|---------|-------|-------|--------|
| `auth` | logins staff/cliente, forgot-password, reset-password, master login | correo + IP | `AUTH_RATE_LIMIT` (default 6/min) |
| `login` | `login-admin` | correo + IP (Fortify) | 5/min |
| `two-factor` | `two-factor-challenge` (tenant admin + master) | challenge_token + IP | 5/min |
| `onboarding` | `GET /api/master/onboarding/{token}` | IP | `ONBOARDING_RATE_LIMIT` (30/min) |
| `onboarding-complete` | `POST /api/master/onboarding/{token}` | IP + token | `ONBOARDING_COMPLETE_RATE_LIMIT` (5/min) |

**Contraseñas staff (panel admin):** mínimo 8 caracteres (igual que registro cliente y onboarding).

**Google OAuth:** el parámetro `state` va firmado con HMAC (`TenantOAuthState`). Un `state` alterado o legacy sin firma se rechaza en el callback. El token Sanctum se entrega vía `POST /api/auth/oauth/exchange` (código de un solo uso), no en la query del callback.

---

## Errores de sesión admin (Fase 1)

`RequireAdmin` valida `/api/auth/me`. Si el token es de otro rol o el tenant no coincide, guarda mensaje en `sessionStorage.admin_login_error` y redirige a `/staff?rol=admin`.

`LoginStaffPage` lee y muestra ese mensaje al cargar (solo rol administrador).

---

## Puerta del tenant (licencia)

Además del rol, el tenant debe cumplir:

- `status = active` (no `suspended`, no `pending`…)
- `access_expires_at` null o fecha futura

Si falla → 403 JSON con `code` (`tenant_suspended` / `tenant_license_expired`) y mensaje en español. El frontend redirige a `/acceso-bloqueado`.

---

## Fortify: qué usa el proyecto

Fortify **no** expone rutas HTTP (`Fortify::ignoreRoutes()` en `register()` del `FortifyServiceProvider`).

| Uso | Detalle |
|-----|---------|
| ✅ Reset password | URLs y correos por tenant (`ResetUserPassword`) |
| ✅ Acciones TOTP | `EnableTwoFactorAuthentication`, etc. vía `AdminTwoFactorController` |
| ✅ Rate limiters | `login`, `two-factor` (consumidos por rutas API) |
| ❌ Login web Fortify | `AdminAuthController` + Sanctum |
| ❌ Registro / perfil Fortify | Acciones eliminadas (no aplican al dominio `Usuario`) |

Redirects legacy en frontend: `/login-admin` → `/staff?rol=admin` (compatibilidad con enlaces antigos).

---

## Master: login y 2FA (Sprint 1)

1. `POST /api/master/auth/login` con email y contraseña.
2. Si 2FA activo → `{ two_factor: true, challenge_token, email_sent }`. Se envía el **mismo código TOTP de 6 dígitos** al correo del Master (requiere SMTP configurado).
3. `POST /api/master/auth/two-factor-challenge` → token `master_api_token`.
4. `POST /api/master/auth/two-factor-email` con `challenge_token` → reenvía el código al correo (máx. 5 envíos / 5 min por usuario).

Gestión 2FA (logueado como Master):

- `GET/POST/DELETE /api/master/two-factor/*` (enable, confirm, recovery-codes con contraseña, disable).

**Contraseña Master en producción:** mínimo 12 caracteres con mayúsculas, minúsculas y números (`MasterPasswordPolicy`). En local se permite `master123` con advertencia en log.

---

## Google OAuth cliente (Sprint 1)

Tras el callback de Google, el backend **no** envía el token Sanctum en la URL. Redirige con `?code=` (64 caracteres, TTL 2 min).

La SPA llama `POST /api/auth/oauth/exchange` con `{ code }` y recibe `{ token }`. El código es de un solo uso y ligado al slug del tenant.
