# API — endpoints retirados (limpieza)

Endpoints eliminados por no usarse en el frontend ni en tests. Alternativas:

| Eliminado | Usar en su lugar |
|-----------|------------------|
| `GET /api/mesero/pedidos-listos` | `GET /api/mesero/alertas` → campo `pedidos_listos` |
| `GET /api/cajero/ventas-hoy` | `GET /api/cajero/ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` |
| `GET /api/cliente/productos` | `GET /api/public/productos-carta` (carta) |
| `GET /api/cliente/mesas` | `GET /api/cliente/reservas/disponibilidad?fecha=…` |
| `PUT/POST /api/admin/restaurante-config` | Solo lectura: `GET /api/admin/restaurante-config` |
| `POST /api/master/two-factor/recovery-codes` | Códigos al activar: `POST /api/master/two-factor/enable` |
| Ruta frontend `/admin/suscripcion` | `/admin/configuracion#suscripcion` |

## Conservados a propósito

| Endpoint | Motivo |
|----------|--------|
| `POST /api/auth/login` | Bloquea bypass de admin hacia login genérico (ver `AuthAdminBypassTest`) |

Ver [AUTH.md](./AUTH.md) para flujos de autenticación.
