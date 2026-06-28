<?php

return [
    'paths'                    => ['api/*'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => [
        env('FRONTEND_URL', 'http://localhost:3000', 'http://127.0.0.1:3000'),
        env('NODE_API_URL',  'http://localhost:5000'),
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => true,
];