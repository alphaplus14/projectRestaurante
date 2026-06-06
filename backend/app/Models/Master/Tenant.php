<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    protected $connection = 'master';

    protected $fillable = [
        'slug',
        'db_name',
        'contact_email',
        'nombre_comercial',
        'status',
        'provision_error',
        'provisioned_at',
        'onboarding_completed_at',
    ];

    protected function casts(): array
    {
        return [
            'provisioned_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
        ];
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(OnboardingInvitation::class, 'tenant_id');
    }

    public function tenantAppUrl(): string
    {
        return \App\Support\Tenancy\TenantUrl::appForSlug($this->slug);
    }
}
