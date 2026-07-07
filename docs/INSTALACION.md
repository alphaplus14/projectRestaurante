# Guía de instalación

Documento con las dependencias y comandos necesarios para instalar y ejecutar el
software de gestión de restaurante (backend Laravel + frontend React).

---

## 1. Requisitos previos (software base)

| Software | Versión recomendada | Para qué sirve |
|----------|---------------------|----------------|
| **PHP** | 8.3 o superior | Backend (Laravel) |
| **Composer** | 2.x | Gestor de dependencias de PHP |
| **Node.js** | 20 LTS o superior | Frontend (build con Vite) |
| **npm** | 10 o superior | Gestor de dependencias JS (incluido con Node) |
| **MySQL / MariaDB** | MySQL 8 / MariaDB 10.4+ | Base de datos |
| **Git** | Cualquiera reciente | Control de versiones |

**Extensiones de PHP necesarias** (normalmente activas en XAMPP/Laragon):
`pdo_mysql`, `mbstring`, `openssl`, `bcmath`, `ctype`, `fileinfo`, `tokenizer`,
`xml`, `curl`, `gd`.

---

## 2. Backend (Laravel) — carpeta `backend/`

### Dependencias de producción

| Paquete | Versión | Función |
|---------|---------|---------|
| `laravel/framework` | ^13.0 | Framework principal |
| `laravel/sanctum` | ^4.3 | Autenticación por tokens API |
| `laravel/fortify` | ^1.37 | Login, 2FA y reseteo de contraseña |
| `laravel/socialite` | ^5.27 | Inicio de sesión con Google (OAuth) |
| `laravel/tinker` | ^3.0 | Consola interactiva |

### Dependencias de desarrollo

| Paquete | Versión | Función |
|---------|---------|---------|
| `fakerphp/faker` | ^1.23 | Datos de prueba (seeders) |
| `laravel/pail` | ^1.2.5 | Visor de logs en consola |
| `laravel/pint` | ^1.27 | Formateador de código |
| `mockery/mockery` | ^1.6 | Mocks para pruebas |
| `nunomaduro/collision` | ^8.6 | Reporte de errores en CLI |
| `phpunit/phpunit` | ^12.5.12 | Pruebas automatizadas |

### Comandos de instalación

```bash
cd backend
composer install
cp .env.example .env        # En Windows (PowerShell): copy .env.example .env
php artisan key:generate
```

<<<<<<< HEAD
Configura la conexión a la base de datos en el archivo `.env` y luego ejecuta las
migraciones:

```bash
php artisan migrate --force
php artisan migrate --path=database/migrations/tenant_patches --force
```

> **Nota:** la segunda migración (`tenant_patches`) aplica los ajustes propios del
> proyecto (columnas adicionales como `enviado_caja_en`, facturación, 2FA, etc.).
> Es obligatoria para que funcionen todos los módulos.
=======
Configura la conexión a la base de datos en el archivo `.env`, importa el esquema base
y aplica los parches:

```bash
# Importar esquema tenant (ajusta usuario/BD según tu .env)
mysql -u root -p restaurante < ../restaurante.sql

php artisan migrate --path=database/migrations/tenant_patches --force
```

> **Nota:** los parches en `tenant_patches/` aplican columnas y tablas adicionales
> (facturación, 2FA, soft-delete, etc.). Son obligatorios para todos los módulos.
> Ya no hay migraciones en la raíz de `database/migrations/` — ver `docs/MIGRATIONS.md`.
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235

---

## 3. Frontend (React + Vite) — carpeta `frontend/`

### Dependencias de producción

| Paquete | Versión | Función |
|---------|---------|---------|
| `react` | ^19.1.0 | Librería de interfaz |
| `react-dom` | ^19.1.0 | Renderizado de React en el navegador |
| `react-router-dom` | ^7.8.2 | Enrutamiento de páginas |
| `recharts` | ^2.15.4 | Gráficas (reportes / finanzas) |
| `sweetalert2` | ^11.26.24 | Modales y alertas |
| `jspdf` | ^4.2.1 | Generación de facturas en PDF |

### Dependencias de desarrollo

| Paquete | Versión | Función |
|---------|---------|---------|
| `vite` | ^8.0.0 | Servidor de desarrollo y build |
| `@vitejs/plugin-react` | ^5.0.2 | Soporte de React en Vite |
| `tailwindcss` | ^4.0.0 | Framework de estilos CSS |
| `@tailwindcss/vite` | ^4.0.0 | Integración de Tailwind con Vite |

<<<<<<< HEAD
=======
### Variables de entorno

```bash
cd frontend
cp .env.example .env.local    # Windows: copy .env.example .env.local
```

| Variable | Uso |
|----------|-----|
| `VITE_TENANT_BASE_DOMAIN` | Dominio base para subdominios (`localhost` en dev) |
| `VITE_TENANT_PORT` | Puerto de Vite (por defecto `5173`) |
| `VITE_DEV_TENANT_SLUG` | Slug del restaurante si usas `127.0.0.1` sin subdominio |

Ver `docs/TENANCY.md` para multi-tenant y producción.

>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
### Comandos de instalación

```bash
cd frontend
npm install
```

---

## 4. Cómo ejecutar el proyecto

**Backend (API en `http://127.0.0.1:8000`):**

```bash
cd backend
php artisan serve
```

**Frontend (aplicación en `http://127.0.0.1:5173`):**

```bash
cd frontend
npm run dev
```

**Build de producción del frontend:**

```bash
cd frontend
npm run build
```

---

## 5. Instalación desde cero (resumen)

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd projectRestaurante

# 2. Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
<<<<<<< HEAD
php artisan migrate --force
=======
mysql -u root -p restaurante < ../restaurante.sql
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
php artisan migrate --path=database/migrations/tenant_patches --force

# 3. Frontend
cd ../frontend
<<<<<<< HEAD
=======
cp .env.example .env.local
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
npm install

# 4. Ejecutar (en dos terminales separadas)
#    Terminal 1 (backend):
cd backend
php artisan serve

#    Terminal 2 (frontend):
cd frontend
npm run dev
```

---

## 6. Notas adicionales

- **Inicio de sesión con Google:** requiere configurar las credenciales OAuth.
  Ver `backend/GOOGLE_OAUTH.md`.
- **Multi-restaurante (multi-tenant):** ver `docs/TENANCY.md`. En desarrollo local
  con una sola base de datos se usa el modo `single` (no requiere base `master`).
- **Autenticación y 2FA:** ver `docs/AUTH.md`.
<<<<<<< HEAD
=======
- **Índice de documentación:** ver `docs/README.md`.
- **Renovación de suscripción (Nequi):** ver `docs/BILLING_RENEWAL.md` (Master → Ajustes/Pagos,
  admin → **Configuración** → *Suscripción y licencia*). Tras actualizar el repo, ejecuta `npm install` en `frontend/`
  si aparece error de módulo faltante (p. ej. `jspdf` para facturas PDF).
>>>>>>> d64649b2bf471a991732fdb4970ed329c111f235
