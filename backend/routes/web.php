<?php

use App\Livewire\Auth\LoginForm;
use App\Livewire\Auth\RegisterForm;
use App\Livewire\Admin\ResourcePage as AdminResourcePage;
use App\Livewire\Client\ClientCart;
use App\Livewire\Client\ClientHub;
use App\Livewire\Client\MenuShop;
use App\Livewire\Client\OrderShow;
use App\Livewire\Client\OrdersIndex;
use App\Livewire\Dashboard;
use App\Livewire\Profile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

Route::get('/', function () {
    return view('welcome');
});

// Cookie CSRF pour le frontend SPA (Sanctum) — inchangé pour Next.js
Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show'])
    ->middleware('web')
    ->name('sanctum.csrf-cookie');

/*
|--------------------------------------------------------------------------
| Frontend Blade + Livewire (guard web / session)
|--------------------------------------------------------------------------
| Les routes API (/api/*) ne sont pas modifiées. La connexion Next.js continue
| d’utiliser POST /api/login avec le guard « api » ; ce flux est indépendant.
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', LoginForm::class)->name('login');
    Route::get('/register', RegisterForm::class)->name('register');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', Dashboard::class)->name('dashboard');
    Route::get('/profile', Profile::class)->name('profile');
});

Route::middleware(['auth', 'ensure.role:admin'])->prefix('admin-blade')->name('admin.blade.')->group(function () {
    Route::get('/{section}', AdminResourcePage::class)->name('resource');
});

Route::middleware(['auth', 'ensure.role:client'])->prefix('client')->name('client.')->group(function () {
    Route::get('/', ClientHub::class)->name('home');
    Route::get('/cart', ClientCart::class)->name('cart');
    Route::get('/menus', MenuShop::class)->name('menus');
    Route::get('/orders', OrdersIndex::class)->name('orders.index');
    Route::get('/orders/{order}', OrderShow::class)->name('orders.show');
});

Route::post('/logout', function (\Illuminate\Http\Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
})->middleware('auth')->name('logout');
