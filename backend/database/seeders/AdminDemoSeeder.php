<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Subscription;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AdminDemoSeeder extends Seeder
{
    /**
     * Crée des données de démo pour tous les rôles
     */
    public function run()
    {
        $cuisinier = User::where('email', 'cuisinier@test.com')->first();
        $client = User::where('email', 'client@test.com')->first();
        $admin = User::where('email', 'admin@test.com')->first();

        if (!$cuisinier || !$client || !$admin) {
            $this->command->warn('⚠️  Exécutez UsersTableSeeder d\'abord');
            return;
        }

        // ========== MENUS (créés par MenusSeeder) ==========
        $createdMenus = Menu::orderBy('id')->get();
        if ($createdMenus->isEmpty()) {
            $this->command->warn('Aucun menu trouvé. Exécutez : php artisan db:seed --class=MenusSeeder');
            return;
        }

        // ========== COMMANDES ==========
        $order1 = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $client->id,
            'status' => 'completed',
            'total_amount' => 25.0,
            'delivery_address' => '123 Avenue de la Paix, Kinshasa',
            'delivery_code' => 'GX-' . strtoupper(Str::random(6)),
            'points_earned' => 25,
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'menu_id' => $createdMenus[1]->id, // Burger
            'quantity' => 2,
            'price' => 12.5,
        ]);

        $order2 = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $client->id,
            'status' => 'pending',
            'total_amount' => 8.0,
            'delivery_address' => '456 Boulevard Lumumba, Kinshasa',
            'delivery_code' => 'GX-' . strtoupper(Str::random(6)),
            'points_earned' => 0,
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'menu_id' => $createdMenus[2]->id, // Salade
            'quantity' => 1,
            'price' => 8.0,
        ]);

        // ========== ABONNEMENTS ==========
        Subscription::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $client->id,
            'plan' => 'Semaine',
            'price' => 9.99,
            'status' => 'active',
            'started_at' => Carbon::now()->subDays(3),
            'expires_at' => Carbon::now()->addDays(4),
        ]);

        // ========== PROMOTIONS ==========
        Promotion::create([
            'admin_id' => $admin->id,
            'menu_id' => $createdMenus[0]->id, // Poulet Moambe
            'points_required' => 50,
            'discount' => 15.50,
            'start_at' => Carbon::now()->subDays(7),
            'end_at' => Carbon::now()->addDays(7),
            'quantity_limit' => 100,
        ]);

        Promotion::create([
            'admin_id' => $admin->id,
            'menu_id' => $createdMenus[1]->id, // Burger
            'points_required' => 30,
            'discount' => 25.00,
            'start_at' => Carbon::now()->subDays(3),
            'end_at' => Carbon::now()->addDays(10),
            'quantity_limit' => 50,
        ]);

        $this->command->info('✅ Données démo créées :');
        $this->command->info('   - 5 menus (3 approved, 1 pending)');
        $this->command->info('   - 2 commandes (1 completed, 1 pending)');
        $this->command->info('   - 1 abonnement actif');
        $this->command->info('   - 2 promotions actives');
    }
}
