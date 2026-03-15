<?php

use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

Route::get('/', function () {
    return view('welcome');
});

// Cookie CSRF pour le frontend SPA (Sanctum) — route explicite pour éviter 404
Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show'])
    ->middleware('web')
    ->name('sanctum.csrf-cookie');
