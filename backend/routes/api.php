<?php

use App\Http\Controllers\Api\AdminCocineroController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminMesaController;
use App\Http\Controllers\Api\AdminMeseroController;
use App\Http\Controllers\Api\AdminProductoController;
use App\Http\Controllers\Api\AdminReservaController;
use App\Http\Controllers\Api\AdminRestauranteConfigController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClienteReservaController;
use App\Http\Controllers\Api\CocinaPedidoController;
use App\Http\Controllers\Api\GastoController;
use App\Http\Controllers\Api\IngredienteController;
use App\Http\Controllers\Api\MeseroController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::get('public/productos-carta', [ProductoController::class, 'catalogoPublico']);

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('login-cliente', [AuthController::class, 'loginCliente']);
    Route::post('login-cocina', [AuthController::class, 'loginCocina']);
    Route::post('login-mesero', [AuthController::class, 'loginMesero']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(['auth:sanctum', 'role:CLIENTE'])->prefix('cliente')->group(function () {
    Route::get('productos', [ProductoController::class, 'indexCliente']);
    Route::get('mesas', [ClienteReservaController::class, 'mesas']);
    Route::get('reservas', [ClienteReservaController::class, 'index']);
    Route::post('reservas', [ClienteReservaController::class, 'store']);
    Route::post('reservas/{reserva:idReserva}/cancelar', [ClienteReservaController::class, 'cancelar']);
});

Route::middleware(['auth:sanctum', 'role:MESERO'])->prefix('mesero')->group(function () {
    Route::get('mesas', [MeseroController::class, 'mesas']);
    Route::get('pedidos-listos', [MeseroController::class, 'pedidosListos']);
    Route::post('pedidos/{pedido:idPedido}/recibir', [MeseroController::class, 'recibirPedido']);
    Route::get('categorias', [ProductoController::class, 'categoriasMesero']);
    Route::get('productos', [ProductoController::class, 'indexMesero']);
    Route::post('pedidos', [MeseroController::class, 'storePedido']);
    Route::post('pedidos/{pedido:idPedido}/cerrar', [MeseroController::class, 'cerrarPedido']);
    Route::post('pedidos/{pedido:idPedido}/cancelar', [MeseroController::class, 'cancelarPedido']);
    Route::get('pedidos/{pedido:idPedido}', [MeseroController::class, 'showPedido']);
    Route::post('pedidos/{pedido:idPedido}/detalles', [MeseroController::class, 'storeDetalle']);
});

Route::middleware(['auth:sanctum', 'role:COCINERO'])->prefix('cocina')->group(function () {
    Route::get('pedidos', [CocinaPedidoController::class, 'index']);
    Route::patch('pedidos/{pedido:idPedido}/estado', [CocinaPedidoController::class, 'updateEstado']);
});

Route::middleware(['auth:sanctum', 'role:ADMINISTRADOR'])->prefix('admin')->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index']);

    Route::get('reservas', [AdminReservaController::class, 'index']);

    Route::get('mesas', [AdminMesaController::class, 'index']);
    Route::post('mesas', [AdminMesaController::class, 'store']);
    Route::put('mesas/{mesa:idMesa}', [AdminMesaController::class, 'update']);
    Route::patch('mesas/{mesa:idMesa}/activo', [AdminMesaController::class, 'setActivo']);
    Route::delete('mesas/{mesa:idMesa}', [AdminMesaController::class, 'destroy']);
    Route::get('mesas/{mesa:idMesa}/historial', [AdminMesaController::class, 'historialPedidos']);

    Route::get('productos', [AdminProductoController::class, 'index']);
    Route::post('productos', [AdminProductoController::class, 'store']);
    Route::get('productos/{producto:idProducto}', [AdminProductoController::class, 'show']);
    Route::match(['put', 'post'], 'productos/{producto:idProducto}', [AdminProductoController::class, 'update']);
    Route::patch('productos/{producto:idProducto}/activo', [AdminProductoController::class, 'setActivo']);
    Route::delete('productos/{producto:idProducto}', [AdminProductoController::class, 'destroy']);

    Route::get('meseros', [AdminMeseroController::class, 'index']);
    Route::post('meseros', [AdminMeseroController::class, 'store']);
    Route::put('meseros/{usuario:idUsuario}', [AdminMeseroController::class, 'update']);
    Route::patch('meseros/{usuario:idUsuario}/activo', [AdminMeseroController::class, 'setActivo']);

    Route::get('cocineros', [AdminCocineroController::class, 'index']);
    Route::post('cocineros', [AdminCocineroController::class, 'store']);
    Route::put('cocineros/{usuario:idUsuario}', [AdminCocineroController::class, 'update']);
    Route::patch('cocineros/{usuario:idUsuario}/activo', [AdminCocineroController::class, 'setActivo']);

    Route::get('restaurante-config', [AdminRestauranteConfigController::class, 'show']);
    Route::match(['put', 'post'], 'restaurante-config', [AdminRestauranteConfigController::class, 'update']);

    // Reportes (rama cris — HU13–15)
    Route::get('reportes/ventas-hoy', [ReporteController::class, 'ventasHoy']);
    Route::get('reportes/ventas', [ReporteController::class, 'ventasPorFecha']);
    Route::get('reportes/productos-mas-vendidos', [ReporteController::class, 'productosMasVendidos']);

    // Inventario (rama cris — HU16–17)
    Route::get('inventario/alertas', [IngredienteController::class, 'alertas']);
    Route::get('inventario/ingredientes', [IngredienteController::class, 'index']);
    Route::post('inventario/ingredientes', [IngredienteController::class, 'store']);
    Route::put('inventario/ingredientes/{ingrediente:idIngrediente}', [IngredienteController::class, 'update']);
    Route::post('inventario/ingredientes/{ingrediente:idIngrediente}/movimiento', [IngredienteController::class, 'registrarMovimiento']);
    Route::get('inventario/ingredientes/{ingrediente:idIngrediente}/movimientos', [IngredienteController::class, 'movimientos']);

    // Finanzas (rama cris — HU18–19)
    Route::get('finanzas/gastos', [GastoController::class, 'index']);
    Route::post('finanzas/gastos', [GastoController::class, 'store']);
    Route::put('finanzas/gastos/{gasto:idGasto}', [GastoController::class, 'update']);
    Route::delete('finanzas/gastos/{gasto:idGasto}', [GastoController::class, 'destroy']);
    Route::get('finanzas/pyg', [GastoController::class, 'pyg']);

    // Usuarios unificados (rama cris — HU20)
    Route::get('usuarios', [UsuarioController::class, 'index']);
    Route::post('usuarios', [UsuarioController::class, 'store']);
    Route::put('usuarios/{usuario:idUsuario}', [UsuarioController::class, 'update']);
    Route::patch('usuarios/{usuario:idUsuario}/activo', [UsuarioController::class, 'setActivo']);
});
