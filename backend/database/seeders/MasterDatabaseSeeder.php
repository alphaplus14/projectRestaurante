<?php

namespace Database\Seeders;

use App\Models\Master\MasterUser;
use App\Support\Auth\MasterPasswordPolicy;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class MasterDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $email = strtolower(trim((string) env('MASTER_ADMIN_EMAIL', 'master@local.test')));
        $password = (string) env('MASTER_ADMIN_PASSWORD', 'master123');

        MasterPasswordPolicy::assertForEnvironment($password);

        if (app()->environment('local', 'testing') && MasterPasswordPolicy::isKnownWeakDefault($password)) {
            Log::warning('MASTER_ADMIN_PASSWORD uses a known weak default. Change it before production.');
        }

        MasterUser::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Master Admin',
                'password' => $password,
                'activo' => true,
            ],
        );
    }
}
