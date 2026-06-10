# Roadmap de mejoras — proyectoLibre_Restaurante

Plan por fases acordado para estabilizar, limpiar y pulir el producto SaaS multi-tenant.

---

## Fase 1 — Estabilizar ✅

**Objetivo:** rutas y auth coherentes; UX mínima sin sorpresas.

| # | Tarea | Estado | Notas |
|---|--------|--------|-------|
| 1.1 | Resolver conflicto de merge en `backend/routes/api.php` | ✅ | Se conservó `AdminAuthController` + 2FA + reset; staff bajo `throttle:auth` |
| 1.2 | Mostrar `admin_login_error` en `LoginStaffPage` | ✅ | Mensajes de `RequireAdmin` al expulsar sesión incorrecta |
| 1.3 | Catch-all respeta host master | ✅ | `CatchAllRedirect` en `App.jsx` → `/master` si `isMasterHost()` |

**Rutas auth tenant (post-fix):**

```
throttle:auth  → login, login-cliente, register-cliente, login-cocina, login-mesero, login-cajero, forgot-password
throttle:login → login-admin
throttle:two-factor → two-factor-challenge
throttle:auth → reset-password (Fase 5 P1)
```

Ver detalle en [AUTH.md](./AUTH.md).

### Verificación Fase 1 (2026-06-07)

| Prueba | Resultado |
|--------|-----------|
| Sin marcadores `<<<<<<<` en `api.php` | ✅ |
| `route:list` → `AdminAuthController@login` + `two-factor-challenge` | ✅ |
| `POST login-admin` responde 422 (credenciales inválidas) | ✅ |
| `throttle:auth` → 429 al 7.º intento fallido (`login-mesero`) | ✅ |
| `master.localhost/xyz` → redirige a `/master/login` | ✅ |
| `chispa.localhost/xyz` → redirige a `/cliente` | ✅ |
| Token inválido en `/admin/dashboard` → staff admin + mensaje de sesión | ✅ |

---

## Fase 2 — Limpiar ✅

**Objetivo:** menos código muerto; onboarding de desarrolladores más claro.

| # | Tarea | Estado | Notas |
|---|--------|--------|-------|
| 2.1 | Eliminar `LoginAdminPage.jsx`, `LoginCajeroPage.jsx`, `StaffPortalPage.jsx` | ✅ | Login unificado en `/staff` |
| 2.2 | Eliminar `AdminLoginResponse` y lógica Fortify de login | ✅ | `FortifyServiceProvider` solo reset + TOTP + limiters |
| 2.3 | Desregistrar rutas Fortify web (`user/two-factor-*`) | ✅ | `Fortify::ignoreRoutes()` en `register()` |
| 2.4 | Documentar licencias en TENANCY | ✅ | Hecho en Fase 1 |
| 2.5 | Reorganizar `pages/` por dominio | ⏭️ | Omitido (opcional; bajo valor vs. diff grande) |

**Extra Fase 2:**

- Eliminados `User.php`, `UserFactory`, acciones Fortify sin uso (`CreateNewUser`, `UpdateUser*`).
- URLs de onboarding/Master: `admin_login` → `/staff?rol=admin` (redirect legacy `/login-admin` se mantiene en `App.jsx`).

### Verificación Fase 2

```bash
cd backend && php artisan route:list | findstr /i "user/two-factor"
# No debe devolver rutas

php artisan route:list --path=api/auth
# login-admin → AdminAuthController
```

---

## Fase 3 — Producto ✅

**Objetivo:** multi-tenant completo en producción; UX de licencia y tests.

| # | Tarea | Estado |
|---|--------|--------|
| 3.1 | Google OAuth con contexto de tenant (slug en `state` + param `tenant`) | ✅ |
| 3.2 | Página `/acceso-bloqueado` + redirect desde `apiClient` en 403 | ✅ |
| 3.3 | Tests: `TenantGate`, licencias, API gate 403 | ✅ |
| 3.4 | Comando `php artisan tenants:migrate-patches` para todos los tenants activos | ✅ |
| 3.5 | Auto-suspender al vencer licencia (`TenantGate`) | ✅ |

### Verificación rápida

```bash
cd backend && php artisan test --filter=Tenant

# OAuth local: desde chispa.localhost:5173 → Google debe volver a chispa.localhost:5173/cliente/oauth-callback
# Licencia: suspend/extend en Master → tenant ve /acceso-bloqueado al llamar API
```

---

## Fase 4 — Seguridad y estabilidad P0 ✅

**Objetivo:** cerrar huecos críticos detectados en la auditoría (2026-06-08).

| # | Problema | Solución | Archivos |
|---|----------|----------|----------|
| 4.1 | Bypass 2FA vía `POST /api/auth/login` | Rechazar rol `ADMINISTRADOR` en login genérico | `AuthController.php`, test `AuthAdminBypassTest` |
| 4.2 | Inventario / Reportes / Finanzas con `http://127.0.0.1:8000/api` | Rutas relativas `/api/admin/...` vía `apiFetch` | `AdminInventarioPage`, `AdminReportesPage`, `AdminFinanzasPage` |
| 4.3 | Migraciones solo en `migrations/` (no en tenants nuevos) | Parches idempotentes en `tenant_patches/` + `restaurante.sql` | `2026_06_08_000001`–`000003`, `restaurante.sql` |

### Aplicar parches en tenants ya provisionados

```bash
cd backend
php artisan tenants:migrate-patches
```

### Verificación P0

```bash
php artisan test --filter=AuthAdminBypass

# Panel admin: Inventario, Reportes y Finanzas deben cargar igual que Dashboard
# curl -X POST .../api/auth/login con admin → 403 (no token)
```

---

## Fase 5 — Seguridad P1 ✅

**Objetivo:** cerrar huecos altos de la auditoría (post-P0).

| # | Problema | Solución | Archivos |
|---|----------|----------|----------|
| 5.1 | `X-Tenant-Slug` / `?tenant=` en producción | Solo `local` y `testing` en `SubdomainResolver` | `SubdomainResolver.php`, test `SubdomainResolverTest` |
| 5.2 | `reset-password` sin rate limit | Dentro de `throttle:auth` | `routes/api.php` |
| 5.3 | Usuario desactivado conserva tokens | `tokens()->delete()` + check `activo` en `RoleMiddleware` | `UsuarioController.php`, `RoleMiddleware.php` |
| 5.4 | Logout staff solo en cliente | `logoutTenantSession()` → `POST /api/auth/logout` | `logoutSession.js`, paneles staff + cliente |

### Verificación P1

```bash
php artisan test --filter="SubdomainResolver|UsuarioDeactivate|AuthAdminBypass"

# Desactivar mesero en admin → su sesión deja de funcionar de inmediato
# Cerrar sesión en cocina/mesero/cajero/admin → token invalidado en servidor
```

---

## Fase 6 — Seguridad P2 ✅

**Objetivo:** endurecer OAuth, onboarding y rutas de plataforma.

| # | Problema | Solución | Archivos |
|---|----------|----------|----------|
| 6.1 | OAuth `state` manipulable (cambio de tenant) | HMAC-SHA256 con `APP_KEY` (`TenantOAuthState`) | `TenantOAuthState.php`, `ClienteGoogleAuthController.php` |
| 6.2 | Onboarding sin throttle / errores internos | `throttle:onboarding` + `onboarding-complete`; log + mensaje genérico | `AppServiceProvider.php`, `api.php`, `OnboardingController.php` |
| 6.3 | Contraseña staff min 6 en panel admin | Unificado `min:8` | `UsuarioController.php` |
| 6.4 | `/master/*` accesible desde subdominios tenant | `RequireMasterHost` redirige a `master.{domain}` | `RequireMasterHost.jsx`, `App.jsx` |
| 6.5 | `/onboarding/*` en subdominio incorrecto | `RequireOnboardingHost` redirige a dominio raíz | `RequireOnboardingHost.jsx`, `App.jsx` |

### Variables opcionales

```env
ONBOARDING_RATE_LIMIT=30
ONBOARDING_COMPLETE_RATE_LIMIT=5
```

### Verificación P2

```bash
php artisan test --filter=TenantOAuthState

# chispa.localhost/master → redirige a master.localhost/master/login
# chispa.localhost/onboarding/TOKEN → redirige a localhost/onboarding/TOKEN
# OAuth: state antiguo sin firma → error en callback
```

---

## Referencias

- [TENANCY.md](./TENANCY.md) — multi-tenant, URLs locales, SMTP
- [AUTH.md](./AUTH.md) — tokens, roles, 2FA, rate limits
- [MIGRATIONS.md](./MIGRATIONS.md) — flujo único de migraciones

---

## Fase 7 — Sprint 1 (producción mínima segura) ✅

**Objetivo:** secretos documentados, Master 2FA, OAuth sin token en URL, migraciones claras.

| # | Tarea | Estado | Archivos |
|---|--------|--------|----------|
| 7.1 | Completar `.env.example` (backend + frontend) | ✅ | `backend/.env.example`, `frontend/.env.example` |
| 7.2 | Política contraseña Master en producción | ✅ | `MasterPasswordPolicy.php`, `MasterDatabaseSeeder.php` |
| 7.3 | 2FA TOTP en login Master + panel dashboard | ✅ | `MasterTwoFactorService.php`, `MasterAuthController.php`, `MasterTwoFactorPanel.jsx` |
| 7.4 | Documentar flujo único de migraciones | ✅ | `docs/MIGRATIONS.md` |
| 7.5 | OAuth: código de un solo uso (no token en query) | ✅ | `OAuthExchangeCode.php`, `POST /api/auth/oauth/exchange` |
| 7.6 | Tests Sprint 1 | ✅ | `Sprint1SecurityTest.php` |

### Verificación Sprint 1

```bash
cd backend
php artisan master:migrate
php artisan test --filter=Sprint1Security

# Master: activar 2FA en dashboard → logout → login pide código TOTP
# Google OAuth: callback URL lleva ?code=... (no ?token=...)
```

---

## Fase 8 — Renovación Nequi (semi-automática) ✅

**Objetivo:** el admin del restaurante notifica pagos por Nequi; el Master confirma o rechaza y extiende la licencia.

| # | Tarea | Estado | Archivos / docs |
|---|--------|--------|-----------------|
| 8.1 | Tablas master `platform_billing_settings`, `subscription_renewal_requests` | ✅ | Migraciones master |
| 8.2 | API Master: ajustes Nequi + aprobar/rechazar solicitudes | ✅ | `MasterBillingController.php` |
| 8.3 | API Admin: estado suscripción + notificar pago | ✅ | `AdminSubscriptionController.php`, `AdminLicenseController.php` |
| 8.4 | UI Master: Ajustes (QR/precios) + panel Pagos | ✅ | `MasterSettingsPanel.jsx`, `MasterBillingRenewalsPanel.jsx` |
| 8.5 | UI Admin: Configuración → suscripción + banner licencia | ✅ | `AdminSubscriptionPanel.jsx`, `AdminLicenseBanner.jsx` |
| 8.6 | Tests + documentación | ✅ | `MasterBillingRenewalTest.php`, [BILLING_RENEWAL.md](./BILLING_RENEWAL.md) |

### Verificación Fase 8 (local)

1. Master → **Ajustes** → llave Nequi, QR y precios por paquete.
2. Admin → **Configuración** → *Suscripción y licencia* → elegir paquete, referencia, **Notificar pago**.
3. Master → **Pagos** → **Confirmar pago** → `access_expires_at` extendido en el tenant.

Ver checklist completo en [BILLING_RENEWAL.md](./BILLING_RENEWAL.md#checklist-prueba-local).
