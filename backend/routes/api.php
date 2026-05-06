<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CocinaPedidoController;
use App\Http\Controllers\Api\MeseroController;
use App\Http\Controllers\Api\ProductoController;
use Illuminate\Support\Facades\Route;

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
    Route::get('pedidos/{pedido:idPedido}', [MeseroController::class, 'showPedido']);
    Route::post('pedidos/{pedido:idPedido}/detalles', [MeseroController::class, 'storeDetalle']);
});

Route::middleware(['auth:sanctum', 'role:COCINERO'])->prefix('cocina')->group(function () {
    Route::get('pedidos', [CocinaPedidoController::class, 'index']);
    Route::patch('pedidos/{pedido:idPedido}/estado', [CocinaPedidoController::class, 'updateEstado']);
});

