<?php

namespace App\Providers;

use App\Models\CompanySubscription;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Route::bind('companySubscription', function (string $value) {
            return CompanySubscription::query()->whereKey($value)->firstOrFail();
        });

        // En local, limite beaucoup plus haute pour éviter 429 (Too Many Requests) pendant le dev / hot reload
        $maxAttempts = app()->environment('local') ? 300 : 60;
        RateLimiter::for('api', function (Request $request) use ($maxAttempts) {
            return Limit::perMinute($maxAttempts)->by($request->user()?->id ?: $request->ip());
        });
    }
}
