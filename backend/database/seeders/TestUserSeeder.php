<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create test users 
        User::truncate();
        
        User::create([
            'name' => 'Test User',
            'email' => 'test@test.com',
            'password' => Hash::make('password'),
            'role' => 'client',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Admin User',
            'email' => 'admin@gexpress.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Entreprise User',
            'email' => 'entreprise@test.com',
            'password' => Hash::make('password'),
            'role' => 'entreprise',
            'email_verified_at' => now(),
        ]);

        echo "✓ Created 3 test users\n";
    }
}
