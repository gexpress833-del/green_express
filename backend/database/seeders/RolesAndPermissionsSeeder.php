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
                    $role->syncPermissions(
                        Permission::where('guard_name', $guard)->pluck('name')->all(),
                    );
                } else {
                    // Filtre uniquement les permissions existantes pour ce guard
                    $perms = Permission::where('guard_name', $guard)
                        ->whereIn('name', $meta['permissions'] ?? [])
                        ->get();
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
            // Recupere le role pour TOUS les guards definis (web + api)
            $roles = Role::where('name', $roleName)->get();
            if ($roles->isEmpty()) {
                continue;
            }
            // syncRoles($collection) accepte un mix de guards et remplace les anciens
            $user->syncRoles($roles);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
