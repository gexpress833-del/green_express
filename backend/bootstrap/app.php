<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Next.js proxy (localhost:3000 → :8000) : utiliser X-Forwarded-Host pour session / CSRF.
        $middleware->trustProxies(at: '*');
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
        // Sanctum SPA : ce middleware seul injecte (pour les origines stateful) la pile
        // cookies + session + CSRF. Ne pas prépéner StartSession/EncryptCookies en plus :
        // double StartSession → session / jeton CSRF incohérents → POST /api/login en 419.
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
