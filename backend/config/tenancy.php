<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Modo de tenencia
    |--------------------------------------------------------------------------
    | single — una sola BD (desarrollo legacy, sin subdominio).
    | multi  — subdominio por cliente + BD master + BD por tenant.
    */
    'mode' => env('TENANCY_MODE', 'single'),

    'base_domain' => env('TENANT_BASE_DOMAIN', 'localhost'),

    'master_subdomain' => env('TENANT_MASTER_SUBDOMAIN', 'master'),

    'reserved_subdomains' => array_filter(array_map(
        'trim',
        explode(',', env('TENANT_RESERVED_SUBDOMAINS', 'www,api,onboarding,mail'))
    )),

    /*
    | BD con el esquema completo del restaurante (se clona estructura al provisionar).
    */
    'template_database' => env('TENANT_TEMPLATE_DATABASE', env('DB_DATABASE', 'restaurante')),

    'database_prefix' => env('TENANT_DATABASE_PREFIX', 'rest_'),

    'onboarding_token_ttl_hours' => (int) env('TENANT_ONBOARDING_TTL_HOURS', 72),

    'frontend_scheme' => env('TENANT_FRONTEND_SCHEME', 'http'),

    'frontend_port' => env('TENANT_FRONTEND_PORT'),

];
