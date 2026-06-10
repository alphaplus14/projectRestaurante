# Inicio de sesión con Google (clientes)

## 1. Google Cloud Console

1. Entra a https://console.cloud.google.com/
2. Crea un proyecto (o usa uno existente).
3. **APIs y servicios** → **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth**.
4. Tipo de aplicación: **Aplicación web**.
5. **URIs de redirección autorizados** (desarrollo local):

   ```
   http://127.0.0.1:8000/auth/google/cliente/callback
   ```

   Si usas `localhost` en `APP_URL`, añade también:

   ```
   http://localhost:8000/auth/google/cliente/callback
   ```

6. Copia el **ID de cliente** y el **Secreto de cliente**.

## 2. Variables en `backend/.env`

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/auth/google/cliente/callback
```

Ejecuta migración si aún no lo hiciste:

```bash
cd backend
php artisan migrate
```

## 3. Error SSL en Windows (`cURL error 60`)

Si ves *unable to get local issuer certificate* al volver de Google:

1. El proyecto incluye `backend/certs/cacert.pem` y Laravel lo usa automáticamente.
2. **Reinicia** `php artisan serve` después de actualizar el código.
3. Opcional (fijo en todo PHP): en tu `php.ini` descomenta y apunta a ese archivo:

   ```ini
   curl.cainfo = "C:\ruta\al\proyecto\backend\certs\cacert.pem"
   openssl.cafile = "C:\ruta\al\proyecto\backend\certs\cacert.pem"
   ```

   Ubica `php.ini` con: `php --ini`

## 4. Servidores en desarrollo

- Backend: `php artisan serve` → `http://127.0.0.1:8000`
- Frontend: `npm run dev` → `http://localhost:5173`

El proxy de Vite reenvía `/auth` al backend, así que el botón **Continuar con Google** funciona desde el front en el puerto 5173.

## 5. Usuarios de prueba (modo Testing)

Si la app OAuth está en **Prueba**, solo pueden iniciar sesión los correos que agregues en:

**Pantalla de consentimiento de OAuth** → **Usuarios de prueba** → Agregar tu Gmail.

Si no está tu correo, Google puede fallar o no devolver datos al callback.

## 6. Flujo

1. El cliente pulsa **Continuar con Google** en el login.
2. El navegador va a `/auth/google/cliente` (Laravel).
3. Laravel redirige a Google.
4. Google vuelve a `/auth/google/cliente/callback`.
5. Laravel crea o enlaza el usuario **CLIENTE** y redirige a  
   `{FRONTEND_URL}/cliente/oauth-callback?code=...&redirect=...` (código de un solo uso, TTL 2 min).
6. La SPA llama `POST /api/auth/oauth/exchange` con el código y recibe el token Sanctum.
7. La SPA guarda el token y lleva al usuario a la ruta indicada.

## 7. Producción

- `APP_URL` = URL pública del API (ej. `https://api.turestaurante.com`).
- `FRONTEND_URL` = URL del sitio React (ej. `https://turestaurante.com`).
- Añade en Google la URI de redirección de producción:
  `https://api.turestaurante.com/auth/google/cliente/callback`
- Si el front y el API están en dominios distintos, configura CORS/sesión según tu despliegue (el flujo OAuth usa rutas **web** con sesión en Laravel).
