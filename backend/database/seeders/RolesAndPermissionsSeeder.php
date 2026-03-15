<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Crée les rôles et permissions (Spatie) et les assigne.
 * Rôles existants Green Express : admin, client, cuisinier, livreur, entreprise, verificateur.
 *
 * Exécution : php artisan db:seed --class=RolesAndPermissionsSeeder
 */
class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Permissions (nom = string unique)
        $permissions = [
            'gérer utilisateurs',
            'gérer commandes',
            'voir statistiques',
            'gérer menus',
            'gérer promotions',
            'gérer entreprises',
            'valider livraisons',
            'valider tickets promotion',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // Rôles et leurs permissions
        $roles = [
            'admin' => ['gérer utilisateurs', 'gérer commandes', 'voir statistiques', 'gérer menus', 'gérer promotions', 'gérer entreprises'],
            'client' => ['voir statistiques'],
            'cuisinier' => ['gérer menus', 'voir statistiques'],
            'livreur' => ['voir statistiques', 'valider livraisons'],
            'entreprise' => ['voir statistiques', 'gérer commandes'],
            'verificateur' => ['voir statistiques', 'valider tickets promotion'],
        ];

        foreach ($roles as $roleName => $permNames) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($permNames);
        }

        // Assigner le rôle Spatie à chaque user selon sa colonne role
        $users = User::all();
        foreach ($users as $user) {
            $roleName = $user->role ?? 'client';
            $role = Role::where('name', $roleName)->first();
            if ($role && ! $user->hasRole($roleName)) {
                $user->assignRole($role);
            }
        }
    }
}
