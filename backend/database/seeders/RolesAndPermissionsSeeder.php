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
        $this->syncPermissionsAndRoleDefinitions();
        $this->syncRolesForAllUsers();
    }

    /**
     * Permissions Spatie + rattachement aux rôles (sans toucher aux utilisateurs).
     */
    public function syncPermissionsAndRoleDefinitions(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $allNames = PermissionCatalog::allPermissionNames();
        // Cree chaque permission pour les deux guards utilises dans l'app :
        //  - 'web'  : sessions classiques (interface admin web, formulaires Blade)
        //  - 'api'  : Sanctum SPA / tokens (utilise par le frontend Next.js et apps mobiles)
        // Sans cela, hasPermissionTo() leve PermissionDoesNotExist pour les requetes API.
        $guards = ['web', 'api'];
        foreach ($guards as $guard) {
            foreach ($allNames as $name) {
                Permission::firstOrCreate(['name' => $name, 'guard_name' => $guard]);
            }
        }

        $rolesConfig = config('roles.roles', []);

        foreach ($guards as $guard) {
            foreach ($rolesConfig as $roleName => $meta) {
                $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => $guard]);
                if ($roleName === 'admin') {
                    // Évite les doublons (config / base) qui cassent l’INSERT pivot role_has_permissions.
                    $perms = Permission::query()
                        ->where('guard_name', $guard)
                        ->orderBy('id')
                        ->get()
                        ->unique('name')
                        ->values();
                    $role->syncPermissions($perms);
                } else {
                    $names = collect($meta['permissions'] ?? [])->unique()->filter()->values()->all();
                    $perms = Permission::where('guard_name', $guard)
                        ->whereIn('name', $names)
                        ->get()
                        ->unique('name')
                        ->values();
                    $role->syncPermissions($perms);
                }
            }
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Applique la colonne legacy users.role aux rôles Spatie (à exécuter après création des users).
     */
    public function syncRolesForAllUsers(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (User::query()->cursor() as $user) {
            $roleName = $user->role ?? 'client';
            // Un seul guard côté User (App\Models\User::$guard_name = 'web') : n’attache pas
            // les rôles « api » en parallèle, sinon Spatie lève GuardDoesNotMatch.
            $role = Role::query()
                ->where('name', $roleName)
                ->where('guard_name', 'web')
                ->first();
            if (! $role) {
                continue;
            }
            $user->syncRoles([$role]);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
