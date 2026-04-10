<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('db:seed-stats', function () {
    $rows = [
        'roles' => Role::query()->count(),
        'permissions' => Permission::query()->count(),
        'subscription_plans' => DB::table('subscription_plans')->count(),
        'event_types' => DB::table('event_types')->count(),
    ];
    $this->line(json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
})->purpose('Compte rôles, permissions, plans, event_types. Render : scripts/db-seed-stats-from-env-production.ps1');
