<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-origin resource sharing (CORS) configuration
    |--------------------------------------------------------------------------
    |
    | For SPA cookie auth (Sanctum), we enable credentials and set sensible
    | defaults. Update 'paths' and 'allowed_origins' as required.
    |
    */
    'paths' => ['api/*', 'sanctum/csrf-cookie', '/sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // For local development, allow the Next.js dev server origins by default.
    // Sans slash final : le navigateur envoie "https://domain.com" sans slash, CORS exige une correspondance exacte.
    'allowed_origins' => array_map(function ($origin) {
        return trim(rtrim($origin, '/'));
    }, explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Sanctum SPA : cookies de session envoyés par le frontend → credentials requis
    'supports_credentials' => true,
];
