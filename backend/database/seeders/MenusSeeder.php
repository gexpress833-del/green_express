<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Database\Seeder;

class MenusSeeder extends Seeder
{
    /**
     * Crée des menus de démonstration.
     * Peut être exécuté seul : php artisan db:seed --class=MenusSeeder
     */
    public function run(): void
    {
        $createdBy = User::whereIn('role', ['cuisinier', 'admin'])->first() ?? User::first();
        if (!$createdBy) {
            $this->command->warn('Aucun utilisateur trouvé. Exécutez d\'abord : php artisan db:seed --class=UsersTableSeeder');
            return;
        }

        $menus = [
            [
                'title' => 'Poulet Moambe',
                'description' => 'Plat traditionnel congolais avec sauce moambe et bananes plantains.',
                'price' => 15000,
                'currency' => 'CDF',
                'status' => 'approved',
            ],
            [
                'title' => 'Burger Gourmet',
                'description' => 'Burger artisanal bœuf, frites maison et sauce signature.',
                'price' => 12.5,
                'currency' => 'USD',
                'status' => 'approved',
            ],
            [
                'title' => 'Salade César',
                'description' => 'Salade fraîche avec poulet grillé, parmesan et croûtons.',
                'price' => 8.0,
                'currency' => 'USD',
                'status' => 'approved',
            ],
            [
                'title' => 'Pizza Margherita',
                'description' => 'Pizza classique tomate, mozzarella et basilic frais.',
                'price' => 10.0,
                'currency' => 'USD',
                'status' => 'approved',
            ],
            [
                'title' => 'Poisson Braisé',
                'description' => 'Poisson frais grillé avec attiéké et légumes.',
                'price' => 20000,
                'currency' => 'CDF',
                'status' => 'approved',
            ],
            [
                'title' => 'Saka-Saka',
                'description' => 'Feuilles de manioc pilées avec poisson ou viande.',
                'price' => 8000,
                'currency' => 'CDF',
                'status' => 'approved',
            ],
            [
                'title' => 'Pâtes Carbonara',
                'description' => 'Pâtes fraîches, lardons, crème et parmesan.',
                'price' => 9.5,
                'currency' => 'USD',
                'status' => 'approved',
            ],
        ];

        foreach ($menus as $data) {
            Menu::firstOrCreate(
                ['title' => $data['title']],
                array_merge($data, ['created_by' => $createdBy->id])
            );
        }

        $this->command->info('✅ ' . count($menus) . ' menus créés (dont visibles : ' . count($menus) . ' en statut approved).');
    }
}
