<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder pour la base PostgreSQL Render « db_greenexpress » (dashboard → Info).
 *
 * Correspondance variables .env (ne jamais committer le mot de passe) :
 * - DB_CONNECTION=pgsql
 * - DB_URL           → une ligne, ex. postgresql://USER:PASS@dpg-….oregon-postgres.render.com:5432/db_greenexpress
 *                      (depuis votre PC : hôte externe + port 5432 ; SSL souvent DB_SSLMODE=require)
 *   ou bien DB_HOST + DB_PORT + DB_DATABASE + DB_USERNAME + DB_PASSWORD
 *
 * Déjà migré : exécuter après `php artisan migrate --force`.
 *
 * Contenu : types d’événements, plans d’abonnement, permissions Spatie, comptes de démo
 * (admin@test.com / password, etc.), menus catalogue. Ne recrée pas les clients réels perdus :
 * si la base a été vidée (migrate:fresh, nouvelle instance Postgres, DATABASE_URL changée),
 * il faut une sauvegarde Render pour retrouver les données historiques.
 *
 * Shell Render (réseau privé, hôte interne possible) :
 *   php artisan config:clear && php artisan db:seed --class=RenderProductionSeeder --force
 *
 * PC Windows (remplace temporairement .env par .env.production puis restaure le .env local) :
 *   cd backend ; .\scripts\seed-render-from-env-production.ps1
 *
 * Sinon, après avoir pointé .env vers la même base Render :
 *   composer seed-render
 */
class RenderProductionSeeder extends Seeder
{
    public function run(): void
    {
        if (config('database.default') !== 'pgsql') {
            $this->command?->warn(
                'RenderProductionSeeder : la connexion par défaut n’est pas « pgsql ». '.
                'Pour la base Render db_greenexpress, définissez DB_CONNECTION=pgsql et les champs du dashboard (Info).'
            );
        }

        $this->call([
            EventTypeSeeder::class,
            SubscriptionPlanSeeder::class,
        ]);

        $rolesSeeder = new RolesAndPermissionsSeeder;
        $rolesSeeder->setCommand($this->command);
        $rolesSeeder->syncPermissionsAndRoleDefinitions();

        $this->call(UsersTableSeeder::class);

        $rolesSeeder->syncRolesForAllUsers();

        $this->call(MenusSeeder::class);
    }
}
