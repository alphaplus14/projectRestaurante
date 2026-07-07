# Migraciones — flujo único

Este proyecto usa **tres pistas de esquema**. No mezcles comandos al azar.

---

## 1. Plataforma Master (`restaurante_master`)

**Cuándo:** primera vez, o al añadir migraciones en `database/migrations/master/`.

```bash
cd backend
php artisan master:migrate --seed
```

- Crea la BD master si no existe.
- Ejecuta solo `database/migrations/master/`.
- `--seed` crea/actualiza el usuario Master desde `MASTER_ADMIN_EMAIL` / `MASTER_ADMIN_PASSWORD`.

**No uses** `php artisan migrate` para el master salvo que sepas lo que haces.

---

## 2. Plantilla tenant (`restaurante` / `TENANT_TEMPLATE_DATABASE`)

**Cuándo:** desarrollo single-tenant o para mantener el dump SQL de referencia.

El esquema base **no** está en migraciones Laravel de la raíz. Impórtalo desde el dump del repo:

```bash
# Ejemplo (ajusta usuario/host/BD según tu .env)
mysql -u root -p restaurante < ../restaurante.sql
```

Luego aplica los parches del proyecto:

```bash
cd backend
php artisan migrate --path=database/migrations/tenant_patches --force
php artisan db:seed --class=Database\\Seeders\\RestauranteSeeder   # opcional, demo
```

La plantilla es la base que se **clona** al provisionar un tenant nuevo.

Tras cambiar esquema tenant, actualiza también:

1. Parches en `database/migrations/tenant_patches/` (idempotentes, con `hasColumn`).
2. El dump `restaurante.sql` en la raíz del repo (si lo usas para instalaciones).

> **Nota:** ya no hay archivos `*_*.php` en `database/migrations/` (solo subcarpetas `master/` y `tenant_patches/`). **No** ejecutes `php artisan migrate` sin `--path`.

---

## 3. Tenants ya provisionados (`rest_*`)

**Cuándo:** añadiste parches nuevos en `tenant_patches/` y los tenants activos ya existen.

```bash
cd backend
php artisan tenants:migrate-patches
```

Aplica cada parche pendiente en **cada tenant activo**. Los parches registran su nombre en la tabla `migrations` del tenant.

**Nuevo tenant:** al completar onboarding, `TenantProvisioner` clona la plantilla y ejecuta los parches que falten.

---

## Qué NO hacer

| Acción incorrecta | Riesgo |
|-------------------|--------|
| `php artisan migrate` sin `--path` | Ya no aplica parches; puede confundir con un flujo obsoleto |
| `migrate` en BD master sin `--path=database/migrations/master` | Tablas tenant mezcladas en master |
| Duplicar parches en la raíz de `database/migrations/` y en `tenant_patches/` | Desincronización (eliminado en limpieza 2026-06) |
| Editar solo la raíz de `database/migrations/` sin `tenant_patches/` | Tenants nuevos desincronizados |
| `migrate:fresh` en producción | Pérdida de datos |
| Parches no idempotentes | Fallo al re-ejecutar en tenants |

---

## Orden recomendado (setup local multi-tenant)

```bash
cd backend

# 1. Master
php artisan master:migrate --seed

# 2. Plantilla (si DB restaurante vacía o nueva)
mysql -u root -p restaurante < ../restaurante.sql
php artisan migrate --path=database/migrations/tenant_patches --force
# php artisan db:seed --class=Database\\Seeders\\RestauranteSeeder   # demo opcional

# 3. Tras cambios de parches
php artisan tenants:migrate-patches
```

---

## Verificación

```bash
php artisan test --filter=Tenant
php artisan route:list --path=api/master
```

Ver también [TENANCY.md](./TENANCY.md) y [ROADMAP.md](./ROADMAP.md).
