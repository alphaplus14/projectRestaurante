# Ñapa — Sistema de toma de pedidos para restaurantes

## Qué es este proyecto
Ñapa es una aplicación web para restaurantes que digitaliza el proceso de toma de pedidos.
Reemplaza completamente el flujo de libreta/papel: meseros toman pedidos desde pantalla,
cocina los recibe en tiempo real, y el administrador gestiona menú, mesas, cuentas y reportes.

**Equipo:** Frank Penilla, César Augusto, Cristian Camilo

---

## Roles del sistema

| Rol | Responsabilidades principales |
|-----|-------------------------------|
| **Administrador** | Gestión de menú, mesas, usuarios, reportes, cuentas, inventario, gastos |
| **Mesero** | Tomar pedidos, ver estados, modificar pedidos en curso, ver mesas |
| **Cocinero** | Recibir comandas, actualizar estado de pedidos (en preparación / listo) |
| **Dueño** | Vista general del negocio (puede coincidir con administrador) |

Cada rol accede **únicamente** a las vistas y funciones que le corresponden.

---

## Módulos del sistema

### 1. Menú y catálogo (HU1–HU3)
- CRUD de productos (nombre, precio, categoría, descripción)
- Productos se pueden desactivar sin eliminar
- Categorías: entradas, platos fuertes, bebidas, postres (configurables)
- Precio mínimo: $500 COP
- No pueden existir dos productos con el mismo nombre en la misma categoría

### 2. Pedidos (HU4–HU6, HU22–HU24)
- El mesero selecciona mesa + productos + cantidades + notas
- El pedido muestra subtotal en tiempo real
- Al confirmar → se envía automáticamente a cocina
- Se pueden agregar/quitar productos **no preparados** aún
- No se puede modificar lo que ya está "En preparación" o "Listo"
- Notas por producto: "sin cebolla", "término del asado", etc.

### 3. Cocina (HU7–HU8)
- Vista dedicada para cocineros
- Pedidos ordenados de más antiguo a más reciente
- Estados actualizables con un clic: Pendiente → En preparación → Listo
- Opción de imprimir comanda

### 4. Mesas (HU9–HU10)
- Mesas con número/nombre y capacidad
- Vista de salón: verde (libre) / rojo (ocupada)
- Al cerrar cuenta → mesa vuelve a libre automáticamente

### 5. Cuentas y pagos (HU11–HU12)
- Cuenta con detalle: producto, cantidad, precio unitario, subtotal, total
- Descuento manual con justificación
- Métodos de pago: efectivo, tarjeta, Nequi, Daviplata (pueden combinarse)
- Si efectivo → calcula cambio
- Se puede imprimir o enviar por WhatsApp

### 6. Reportes y ventas (HU13–HU15)
- Historial de ventas del día (hora, mesa, total, método de pago)
- Reportes por rango de fechas (día, semana, mes)
- Exportable en PDF o Excel
- Ranking de productos más vendidos con ingreso total por producto

### 7. Inventario (HU16–HU17)
- Registro de insumos con nombre, unidad de medida y cantidad
- Alerta visible cuando un insumo baja del nivel mínimo configurado
- Panel de notificaciones de stock bajo

### 8. Finanzas (HU18–HU19)
- Registro de gastos (arriendo, servicios, insumos) con fecha, categoría y descripción
- Vista de ganancias y pérdidas: ingresos − gastos = utilidad neta
- Indicadores visuales: verde (positivo), rojo (negativo) — usar colores del sistema, no rojo/verde puro

### 9. Usuarios y acceso (HU20–HU21)
- CRUD de usuarios con rol asignado
- Login con usuario y contraseña → redirige a vista de su rol
- Debe existir siempre al menos un administrador activo
- Usuarios desactivables sin eliminar

### 10. Configuración del restaurante (HU25)
- Nombre, dirección, teléfono, NIT
- Logo del negocio (aparece en cuentas e impresiones)

---

## Estados de un pedido

```
Pendiente → En preparación → Listo → Entregado
```

- **Pendiente**: recién confirmado, aún no lo atiende cocina
- **En preparación**: cocina lo tomó
- **Listo**: cocina terminó, espera al mesero
- **Entregado**: mesero lo llevó a la mesa

---

## Reglas de negocio clave

- Un producto con pedidos activos no puede eliminarse, solo desactivarse
- Solo el mesero asignado o el administrador pueden modificar un pedido
- No se puede generar cuenta si hay productos pendientes (se puede forzar con confirmación)
- Solo el administrador puede crear/modificar usuarios
- No pueden existir dos mesas con el mismo nombre o número

---

## Contexto de UX
- Interfaz simple y rápida para meseros sin experiencia técnica
- Diseño dark-first con paleta ámbar/terracota (ver design-system.mdc)
- El flujo crítico es: seleccionar mesa → agregar productos → confirmar pedido
- Prioridad de velocidad en pantallas de mesero y cocina
