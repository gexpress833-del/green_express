<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Point;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    /**
     * Crée des utilisateurs de test pour tous les rôles
     * Mot de passe : password (pour tous)
     */
    public function run()
    {
        $users = [
            [
                'name' => 'Admin Principal',
                'email' => 'admin@test.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ],
            [
                'name' => 'Chef Cuisinier',
                'email' => 'cuisinier@test.com',
                'password' => Hash::make('password'),
                'role' => 'cuisinier',
            ],
            [
                'name' => 'Client Test',
                'email' => 'client@test.com',
                'password' => Hash::make('password'),
                'role' => 'client',
            ],
            [
                'name' => 'Livreur Express',
                'email' => 'livreur@test.com',
                'password' => Hash::make('password'),
                'role' => 'livreur',
            ],
            [
                'name' => 'Verificateur QR',
                'email' => 'verificateur@test.com',
                'password' => Hash::make('password'),
                'role' => 'verificateur',
            ],
            [
                'name' => 'Entreprise Demo',
                'email' => 'entreprise@test.com',
                'password' => Hash::make('password'),
                'role' => 'entreprise',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            // Créer solde de points pour le client
            if ($user->role === 'client') {
                Point::updateOrCreate(
                    ['user_id' => $user->id],
                    ['balance' => 120]
                );
            }
        }

        $this->command->info('✅ 6 utilisateurs de test créés (password: password)');
    }
}
