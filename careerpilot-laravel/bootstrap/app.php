<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web:     __DIR__.'/../routes/web.php',
        api:     __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health:  '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {

        // Global API middleware
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Named middleware alias
        $middleware->alias([
            'jwt.verify' => \App\Http\Middleware\VerifyNodeJWT::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Return JSON for all API exceptions
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*')) {
                $status = method_exists($e, 'getStatusCode')
                    ? $e->getStatusCode()
                    : 500;

                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Server error',
                ], $status);
            }
        });
    })
    ->create();