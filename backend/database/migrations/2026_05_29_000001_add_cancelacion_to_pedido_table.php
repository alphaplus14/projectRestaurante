<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedido', function (Blueprint $table) {
            $table->string('motivo_cancelacion', 500)->nullable()->after('notas');
            $table->dateTime('cancelado_en')->nullable()->after('cerrado_en');
        });
    }

    public function down(): void
    {
        Schema::table('pedido', function (Blueprint $table) {
            $table->dropColumn(['motivo_cancelacion', 'cancelado_en']);
        });
    }
};
