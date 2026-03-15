<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basique',
                'description' => '5 jours (lundi–vendredi). Idéal pour découvrir.',
                'price_week' => 25000,
                'price_month' => 100000,
                'currency' => 'CDF',
                'days_per_week' => 5,
                'days_per_month' => 20,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Standard',
                'description' => '5 jours / 20 jours. Le plus populaire.',
                'price_week' => 30000,
                'price_month' => 120000,
                'currency' => 'CDF',
                'days_per_week' => 5,
                'days_per_month' => 20,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Premium',
                'description' => '5 jours / 20 jours. Avantages illimités.',
                'price_week' => 37500,
                'price_month' => 150000,
                'currency' => 'CDF',
                'days_per_week' => 5,
                'days_per_month' => 20,
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
