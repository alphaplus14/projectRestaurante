<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedido_detalle', function (Blueprint $table) {
            $table->string('motivo_cancelacion', 500)->nullable()->after('estado_item');
            $table->dateTime('cancelado_en')->nullable()->after('motivo_cancelacion');
            $table->integer('cancelado_por_idUsuario')->nullable()->after('cancelado_en');

            $table->foreign('cancelado_por_idUsuario')->references('idUsuario')->on('usuario');
        });
    }

    public function down(): void
    {
        Schema::table('pedido_detalle', function (Blueprint $table) {
            $table->dropForeign(['cancelado_por_idUsuario']);
            $table->dropColumn(['motivo_cancelacion', 'cancelado_en', 'cancelado_por_idUsuario']);
        });
    }
};
