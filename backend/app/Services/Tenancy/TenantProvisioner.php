<?php

namespace App\Services\Tenancy;

use App\Models\Cargo;
use App\Models\Master\Tenant;
use App\Models\RestauranteConfig;
use App\Models\Usuario;
use App\Support\Tenancy\TenantConnectionManager;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class TenantProvisioner
{
    /**
     * @param  array{
     *   nombre_comercial: string,
     *   nit_o_documento?: string|null,
     *   telefono?: string|null,
     *   direccion?: string|null,
     *   admin_nombre: string,
     *   admin_apellido: string,
     *   admin_correo: string,
     *   admin_password: string,
     *   admin_cedula?: string|null,
     *   admin_telefono?: string|null,
     *   logo_path?: string|null,
     * }  $payload
     */
    public function provision(Tenant $tenant, array $payload): void
    {
        $tenant->update(['status' => 'provisioning', 'provision_error' => null]);

        try {
            $this->createDatabaseIfMissing($tenant->db_name);
            $this->cloneSchemaFromTemplate($tenant->db_name);
            TenantConnectionManager::connect($tenant);
            $this->runTenantPatchMigrations();
            $this->seedTenantBootstrap($payload);
            $this->finalizeTenantData($payload);

            $tenant->update([
                'status' => 'active',
                'nombre_comercial' => $payload['nombre_comercial'],
                'provisioned_at' => now(),
                'onboarding_completed_at' => now(),
                'provision_error' => null,
            ]);
        } catch (Throwable $e) {
            Log::error('Tenant provision failed', [
                'tenant_id' => $tenant->id,
                'slug' => $tenant->slug,
                'error' => $e->getMessage(),
            ]);

            $tenant->update([
                'status' => 'failed',
                'provision_error' => $e->getMessage(),
            ]);

            throw $e;
        } finally {
            TenantConnectionManager::disconnect();
        }
    }

    public function createDatabaseIfMissing(string $dbName): void
    {
        $safe = preg_replace('/[^a-zA-Z0-9_]/', '', $dbName);
        if ($safe !== $dbName) {
            throw new \InvalidArgumentException('Nombre de base de datos inválido.');
        }

        DB::connection('master')->statement(
            "CREATE DATABASE IF NOT EXISTS `{$safe}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
    }

    public function cloneSchemaFromTemplate(string $targetDb): void
    {
        $template = (string) config('tenancy.template_database');
        if ($template === '' || $template === $targetDb) {
            throw new \RuntimeException('Configura TENANT_TEMPLATE_DATABASE con una BD que tenga el esquema del restaurante.');
        }

        $tables = DB::connection('master')->select('SHOW TABLES FROM `'.$template.'`');
        $key = 'Tables_in_'.$template;

        foreach ($tables as $row) {
            $table = $row->{$key} ?? null;
            if (! is_string($table) || $table === '') {
                continue;
            }

            DB::connection('master')->statement(
                "CREATE TABLE IF NOT EXISTS `{$targetDb}`.`{$table}` LIKE `{$template}`.`{$table}`"
            );
        }
    }

    /** Parches posteriores al esquema clonado (sin migraciones Laravel base). */
    public function runTenantPatchMigrations(): void
    {
        Artisan::call('migrate', [
            '--database' => 'tenant',
            '--path' => 'database/migrations/tenant_patches',
            '--force' => true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function seedTenantBootstrap(array $payload): void
    {
        Artisan::call('db:seed', [
            '--database' => 'tenant',
            '--class' => 'Database\\Seeders\\TenantBootstrapSeeder',
            '--force' => true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function finalizeTenantData(array $payload): void
    {
        $cargos = Cargo::query()->pluck('idCargo', 'nombre');

        RestauranteConfig::query()->updateOrCreate(
            ['idConfig' => 1],
            [
                'nombre_comercial' => $payload['nombre_comercial'],
                'nit_o_documento' => $payload['nit_o_documento'] ?? null,
                'telefono' => $payload['telefono'] ?? null,
                'direccion' => $payload['direccion'] ?? null,
                'logo_url' => $payload['logo_url'] ?? null,
                'actualizado_en' => now(),
            ],
        );

        Usuario::query()->create([
            'nombre' => $payload['admin_nombre'],
            'apellido' => $payload['admin_apellido'],
            'cedula' => $payload['admin_cedula'] ?? '0000000000',
            'telefono' => $payload['admin_telefono'] ?? '3000000000',
            'correo' => $payload['admin_correo'],
            'password' => Hash::make($payload['admin_password']),
            'cargos_idCargo' => $cargos['ADMINISTRADOR'] ?? 4,
            'activo' => true,
            'creado_en' => now(),
        ]);
    }

    public static function storeLogoForTenant(Tenant $tenant, $uploadedFile): ?string
    {
        if (! $uploadedFile) {
            return null;
        }

        $path = $uploadedFile->store('tenants/'.$tenant->slug.'/branding', 'public');

        return Storage::disk('public')->url($path);
    }
}
