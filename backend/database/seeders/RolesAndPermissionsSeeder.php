<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Crée les permissions (Spatie) et les rattache aux rôles selon config/roles.php.
 * Le rôle admin reçoit toutes les permissions connues.
 *
 * php artisan db:seed --class=RolesAndPermissionsSeeder
 */
class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $allNames = PermissionCatalog::allPermissionNames();
        foreach ($allNames as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $rolesConfig = config('roles.roles', []);

        foreach ($rolesConfig as $roleName => $meta) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            if ($roleName === 'admin') {
                $role->syncPermissions(Permission::where('guard_name', 'web')->pluck('name')->all());
            } else {
                $role->syncPermissions($meta['permissions'] ?? []);
            }
        }

        foreach (User::query()->cursor() as $user) {
            $roleName = $user->role ?? 'client';
            if (! Role::where('name', $roleName)->where('guard_name', 'web')->exists()) {
                continue;
            }
            $user->syncRoles([$roleName]);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
