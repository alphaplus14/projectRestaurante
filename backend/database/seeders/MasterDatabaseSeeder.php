<?php

namespace Database\Seeders;

use App\Models\Master\MasterUser;
use Illuminate\Database\Seeder;

class MasterDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('MASTER_ADMIN_EMAIL', 'master@local.test');
        $password = (string) env('MASTER_ADMIN_PASSWORD', 'master123');

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
