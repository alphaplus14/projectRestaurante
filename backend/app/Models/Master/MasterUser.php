<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Hidden(['password'])]
class MasterUser extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $connection = 'master';

    protected $table = 'master_users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'activo' => 'boolean',
        ];
    }
}
