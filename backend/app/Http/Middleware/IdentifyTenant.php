<?php

namespace App\Http\Middleware;

use App\Models\Master\Tenant;
use App\Support\Tenancy\SubdomainResolver;
use App\Support\Tenancy\TenantConnectionManager;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! TenantContext::isMulti()) {
            return $next($request);
        }

        if ($request->is('api/master/*')) {
            app()->instance('tenant.context', 'master');
            config(['database.default' => 'master']);

            return $next($request);
        }

        $subdomain = SubdomainResolver::fromRequest($request);

        if ($subdomain === null) {
            $subdomain = SubdomainResolver::devSlugFromRequest($request);
        }

        if (($subdomain === null || $subdomain === '') && app()->environment('local')) {
            $fallback = trim((string) env('TENANT_DEFAULT_SLUG', ''));
            if ($fallback !== '') {
                $subdomain = strtolower($fallback);
            }
        }

        $masterSub = (string) config('tenancy.master_subdomain', 'master');
        $reserved = config('tenancy.reserved_subdomains', []);

        if ($subdomain === null || $subdomain === '') {
            return response()->json([
                'message' => 'Accede desde el subdominio de tu restaurante (ej. mi-local.tudominio.com).',
            ], 400);
        }

        if ($subdomain === $masterSub || in_array($subdomain, $reserved, true)) {
            return response()->json(['message' => 'Subdominio no válido para la app del restaurante.'], 404);
        }

        $tenant = Tenant::query()
            ->where('slug', $subdomain)
            ->where('status', 'active')
            ->first();

        if (! $tenant) {
            return response()->json([
                'message' => 'Restaurante no encontrado o aún no está activo.',
            ], 404);
        }

        TenantConnectionManager::connect($tenant);

        return $next($request);
    }
}
