<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * @deprecated Utiliser {@see RenderProductionSeeder} (même contenu + types d’événements).
 *
 * Données minimales pour un environnement en ligne : plans + rôles / permissions.
 * Sans comptes @test.com ni commandes démo.
 */
class ProductionSafeSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RenderProductionSeeder::class);
    }
}
