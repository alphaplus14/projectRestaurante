<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminCocineroController;
use App\Http\Controllers\Api\AdminMeseroController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminMesaController;
use App\Http\Controllers\Api\AdminProductoController;
use App\Http\Controllers\Api\CocinaPedidoController;
use App\Http\Controllers\Api\MeseroController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\IngredienteController;
use App\Http\Controllers\Api\GastoController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ReporteController;

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
});

Route::middleware(['auth:sanctum', 'role:MESERO'])->prefix('mesero')->group(function () {
    Route::get('mesas', [MeseroController::class, 'mesas']);
    Route::get('productos', [ProductoController::class, 'indexMesero']);
    Route::post('pedidos', [MeseroController::class, 'storePedido']);
    Route::post('pedidos/{pedido:idPedido}/cerrar', [MeseroController::class, 'cerrarPedido']);
    Route::get('pedidos/{pedido:idPedido}', [MeseroController::class, 'showPedido']);
    Route::post('pedidos/{pedido:idPedido}/detalles', [MeseroController::class, 'storeDetalle']);
});

Route::middleware(['auth:sanctum', 'role:COCINERO'])->prefix('cocina')->group(function () {
    Route::get('pedidos', [CocinaPedidoController::class, 'index']);
    Route::patch('pedidos/{pedido:idPedido}/estado', [CocinaPedidoController::class, 'updateEstado']);
});

Route::middleware(['auth:sanctum', 'role:ADMINISTRADOR'])->prefix('admin')->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index']);

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

    //? Reportes del administrador — parte de Cris (HU13, HU14, HU15)
    Route::get('reportes/ventas-hoy', [ReporteController::class, 'ventasHoy']);
    Route::get('reportes/ventas', [ReporteController::class, 'ventasPorFecha']);
    Route::get('reportes/productos-mas-vendidos', [ReporteController::class, 'productosMasVendidos']);

    //? Inventario — parte de Cris (HU16, HU17)
    Route::get('inventario/alertas', [IngredienteController::class, 'alertas']);
    Route::get('inventario/ingredientes', [IngredienteController::class, 'index']);
    Route::post('inventario/ingredientes', [IngredienteController::class, 'store']);
    Route::put('inventario/ingredientes/{ingrediente:idIngrediente}', [IngredienteController::class, 'update']);
    Route::post('inventario/ingredientes/{ingrediente:idIngrediente}/movimiento', [IngredienteController::class, 'registrarMovimiento']);
    Route::get('inventario/ingredientes/{ingrediente:idIngrediente}/movimientos', [IngredienteController::class, 'movimientos']);

    //? Finanzas — parte de Cris (HU18, HU19)
    Route::get('finanzas/gastos', [GastoController::class, 'index']);
    Route::post('finanzas/gastos', [GastoController::class, 'store']);
    Route::put('finanzas/gastos/{gasto:idGasto}', [GastoController::class, 'update']);
    Route::delete('finanzas/gastos/{gasto:idGasto}', [GastoController::class, 'destroy']);
    Route::get('finanzas/pyg', [GastoController::class, 'pyg']);
});