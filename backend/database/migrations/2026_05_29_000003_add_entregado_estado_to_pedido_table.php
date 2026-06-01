<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE pedido MODIFY estado ENUM('PENDIENTE','EN_PREPARACION','LISTO','ENTREGADO','CERRADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE'"
        );
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE pedido MODIFY estado ENUM('PENDIENTE','EN_PREPARACION','LISTO','CERRADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE'"
        );
    }
};
