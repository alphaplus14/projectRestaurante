# Despliegue en VPS Docker (Sena / Mateo)

Guía para subir el proyecto al servidor Ubuntu con Docker en `/opt/docker-vps`.

| Dato | Valor |
|------|-------|
| IP | `2.25.166.100` |
| Usuario SSH | `backyard` |
| Puerto API (backend) | `8083` |
| Puerto web (frontend) | `8084` |

Archivos de apoyo en la carpeta `deploy/` del repositorio.

---

## Arquitectura

```
Internet
   │
   ├─ http://2.25.166.100:8083  →  nginx central  →  restaurante_back (Laravel API)
   │
   └─ http://2.25.166.100:8084  →  nginx central  →  restaurante_front (React)
                                                      └─ /api → restaurante_back
```

---

## Paso 1 — Conectarse por SSH

**PuTTY:** Host `2.25.166.100`, puerto `22`, usuario `backyard`.

**Cursor:** `Ctrl+Shift+P` → *Remote-SSH: Connect to Host* → `backyard@2.25.166.100`

---

## Paso 2 — Subir el código al servidor

En tu PC (PowerShell), desde la carpeta del proyecto:

```powershell
# Backend → carpeta del contenedor API
scp -r backend/* backyard@2.25.166.100:/opt/docker-vps/restaurante_back/

# Frontend → carpeta del contenedor web
scp -r frontend/* backyard@2.25.166.100:/opt/docker-vps/restaurante_front/

# Dockerfiles y nginx del frontend
scp deploy/restaurante_back/Dockerfile backyard@2.25.166.100:/opt/docker-vps/restaurante_back/
scp deploy/restaurante_front/Dockerfile backyard@2.25.166.100:/opt/docker-vps/restaurante_front/
scp deploy/restaurante_front/nginx-site.conf backyard@2.25.166.100:/opt/docker-vps/restaurante_front/
```

Alternativa: clonar el repo en el servidor y copiar las carpetas:

```bash
cd /opt/docker-vps
git clone <url-del-repo> repo-temp
cp -r repo-temp/backend/* restaurante_back/
cp -r repo-temp/frontend/* restaurante_front/
cp repo-temp/deploy/restaurante_back/Dockerfile restaurante_back/
cp repo-temp/deploy/restaurante_front/Dockerfile restaurante_front/
cp repo-temp/deploy/restaurante_front/nginx-site.conf restaurante_front/
```

---

## Paso 3 — Editar `docker-compose.yml`

```bash
cd /opt/docker-vps
sudo nano docker-compose.yml
```

**A)** Agregar al servicio `nginx` en `depends_on`:

```yaml
    depends_on:
      - restaurante_back
      - restaurante_front
      # ... los demás proyectos que ya existan
```

**B)** Agregar al final (copiar de `deploy/snippets/docker-compose.snippet.yml`):

```yaml
  restaurante_back:
    build: ./restaurante_back
    container_name: restaurante_back
    expose:
      - "80"
    volumes:
      - ./restaurante_back:/var/www/html
    depends_on:
      - mysql
    restart: always

  restaurante_front:
    build: ./restaurante_front
    container_name: restaurante_front
    expose:
      - "80"
    depends_on:
      - restaurante_back
    restart: always
```

Guardar: `Ctrl+O` → Enter → `Ctrl+X`.

---

## Paso 4 — Editar Nginx central

```bash
sudo nano /opt/docker-vps/nginx/conf.d/default.conf
```

Pegar al final el contenido de `deploy/snippets/nginx-default.snippet.conf` (bloques `8083` y `8084`).

---

## Paso 5 — Base de datos MySQL

Pide al administrador las credenciales del contenedor `mysql` o créalas:

```bash
docker exec -it mysql mysql -u root -p
```

```sql
CREATE DATABASE restaurante_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'restaurante_user'@'%' IDENTIFIED BY 'TU_PASSWORD_SEGURA';
GRANT ALL PRIVILEGES ON restaurante_db.* TO 'restaurante_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Importar esquema (desde el servidor):

```bash
docker exec -i mysql mysql -u restaurante_user -p restaurante_db < /opt/docker-vps/restaurante_back/../restaurante.sql
```

Si `restaurante.sql` está en otra ruta, ajústala. También puedes subirlo con `scp`.

---

## Paso 6 — Configurar `.env` del backend

```bash
sudo cp /opt/docker-vps/restaurante_back/.env.example /opt/docker-vps/restaurante_back/.env
sudo nano /opt/docker-vps/restaurante_back/.env
```

Valores mínimos (ver también `deploy/restaurante_back/.env.docker.example`):

```env
APP_NAME="Restaurante"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://2.25.166.100:8083
FRONTEND_URL=http://2.25.166.100:8084

DB_HOST=mysql
DB_DATABASE=restaurante_db
DB_USERNAME=restaurante_user
DB_PASSWORD=TU_PASSWORD_SEGURA

TENANCY_MODE=single
TENANT_DEFAULT_SLUG=restaurante

LOG_LEVEL=error
```

---

## Paso 7 — Levantar contenedores

```bash
cd /opt/docker-vps
sudo docker compose build restaurante_back restaurante_front
sudo docker compose up -d restaurante_back restaurante_front
sudo docker compose restart nginx
```

---

## Paso 8 — Comandos Laravel dentro del contenedor

```bash
# Dependencias PHP
sudo docker exec -it restaurante_back composer install --no-dev --optimize-autoloader

# Clave de aplicación
sudo docker exec -it restaurante_back php artisan key:generate

# Enlace de storage (imágenes de productos)
sudo docker exec -it restaurante_back php artisan storage:link

# Migraciones (parches tenant)
sudo docker exec -it restaurante_back php artisan migrate --path=database/migrations/tenant_patches --force

# Permisos
sudo docker exec -it restaurante_back chown -R www-data:www-data storage bootstrap/cache
sudo docker exec -it restaurante_back chmod -R 775 storage bootstrap/cache
```

---

## Paso 9 — Probar

| URL | Qué debe responder |
|-----|-------------------|
| http://2.25.166.100:8083/up | `{"status":"ok"}` o similar (health Laravel) |
| http://2.25.166.100:8084 | Landing / sitio del restaurante |
| http://2.25.166.100:8084/staff?rol=admin | Login del administrador |

---

## Actualizar después de cambios en el código

**Backend:**

```bash
scp -r backend/* backyard@2.25.166.100:/opt/docker-vps/restaurante_back/
ssh backyard@2.25.166.100 "cd /opt/docker-vps && sudo docker compose restart restaurante_back"
```

**Frontend** (requiere rebuild porque es estático):

```bash
scp -r frontend/* backyard@2.25.166.100:/opt/docker-vps/restaurante_front/
ssh backyard@2.25.166.100 "cd /opt/docker-vps && sudo docker compose build restaurante_front && sudo docker compose up -d restaurante_front"
```

---

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| 502 en 8083/8084 | `sudo docker compose ps` — verificar que los contenedores estén *Up* |
| Error de BD | Revisar `DB_HOST=mysql` y credenciales en `.env` |
| Pantalla en blanco en 8084 | Rebuild del frontend: `docker compose build restaurante_front` |
| API no responde desde el front | Verificar que `nginx-site.conf` esté en `restaurante_front/` |
| "No se identificó el restaurante" | Confirmar `TENANT_DEFAULT_SLUG=restaurante` en backend y rebuild del front con `VITE_TENANT_DEFAULT_SLUG=restaurante` |

---

## Seguridad

- No compartas contraseñas en chats ni las subas al repositorio.
- Cambia la contraseña SSH si ya fue expuesta.
- Mantén `APP_DEBUG=false` en producción.
