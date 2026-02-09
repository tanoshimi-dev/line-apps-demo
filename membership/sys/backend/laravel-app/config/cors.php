<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | In production, set CORS_ALLOWED_ORIGINS in .env to your domain.
    | Example: CORS_ALLOWED_ORIGINS=https://your-domain.com
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', '*')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Test-User-Id', 'X-Test-Display-Name', 'X-Test-Picture-Url'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => false,

];
