<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pricing_tiers')) {
            return;
        }
        if (DB::table('pricing_tiers')->where('plan_name', 'Green Express')->exists()) {
            return;
        }
        DB::table('pricing_tiers')->insert([
            'plan_name' => 'Green Express',
            'min_employees' => 1,
            'max_employees' => 99999,
            'price_per_meal_usd' => 1.5,
            'price_per_meal_cdf' => 3750,
            'exchange_rate' => 2500,
            'currency' => 'USD',
            'description' => '1,5 $ par jour, 20 jours = 30 $ par employé/mois',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('pricing_tiers')->where('plan_name', 'Green Express')->delete();
    }
};
