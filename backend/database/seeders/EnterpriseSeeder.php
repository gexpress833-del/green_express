<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\CompanyEmployee;
use App\Models\CompanyMenu;
use App\Models\CompanySubscription;
use App\Models\EmployeeMealPlan;
use App\Models\MealSide;
use App\Models\PricingTier;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeder pour le système B2B Entreprise
 * Crée des données de test pour démonstration
 */
class EnterpriseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Créer les tiers tarifaires s'ils n'existent pas
        if (PricingTier::count() === 0) {
            PricingTier::create([
                'plan_name' => 'Startup',
                'min_employees' => 1,
                'max_employees' => 9,
                'price_per_meal_usd' => 3.00,
                'price_per_meal_cdf' => 6000,
                'exchange_rate' => 2000.00,
                'currency' => 'USD',
                'description' => 'Pour petites équipes 1-9 personnes',
                'is_active' => true,
            ]);

            PricingTier::create([
                'plan_name' => 'Standard',
                'min_employees' => 10,
                'max_employees' => 49,
                'price_per_meal_usd' => 2.50,
                'price_per_meal_cdf' => 5000,
                'exchange_rate' => 2000.00,
                'currency' => 'USD',
                'description' => 'Pour équipes moyennes 10-49 personnes',
                'is_active' => true,
            ]);

            PricingTier::create([
                'plan_name' => 'Scale',
                'min_employees' => 50,
                'max_employees' => 99,
                'price_per_meal_usd' => 2.00,
                'price_per_meal_cdf' => 4000,
                'exchange_rate' => 2000.00,
                'currency' => 'USD',
                'description' => 'Pour grandes équipes 50-99 personnes',
                'is_active' => true,
            ]);

            PricingTier::create([
                'plan_name' => 'Enterprise',
                'min_employees' => 100,
                'max_employees' => 99999,
                'price_per_meal_usd' => 1.50,
                'price_per_meal_cdf' => 3000,
                'exchange_rate' => 2000.00,
                'currency' => 'USD',
                'description' => 'Pour très grandes organisations 100+ personnes',
                'is_active' => true,
            ]);
        }

        // 2. Créer une entreprise de test (ou récupérer si elle existe)
        $contactUser = User::where('role', 'entreprise')->first() ?? User::factory()->create(['role' => 'entreprise']);

        $company = Company::firstOrCreate(
            ['slug' => 'microsoft-kinshasa'],
            [
                'name' => 'Microsoft Kinshasa',
                'email' => 'contact@microsoft-drc.com',
                'phone' => '+243 970 123 456',
                'address' => 'Avenue de l\'OUA, Kinshasa',
                'institution_type' => 'privee',
                'contact_user_id' => $contactUser->id,
                'status' => 'active',
                'employee_count' => 15,
            ]
        );

        // 3. Créer les employés (si pas déjà créés)
        $employees = [];
        
        if ($company->employees()->count() === 0) {
            for ($i = 1; $i <= 15; $i++) {
                $employees[] = CompanyEmployee::create([
                    'company_id' => $company->id,
                    'full_name' => "Employee {$i}",
                    'function' => $i % 3 === 0 ? 'manager' : 'employ',
                    'matricule' => "EMP" . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'phone' => "+243 970 " . str_pad($i * 10000, 6, '0', STR_PAD_LEFT),
                    'email' => "emp{$i}@microsoft-kinshasa.greenexpress.com",
                    'password' => bcrypt('password123'),
                    'account_status' => 'active',
                ]);
            }
        } else {
            $employees = $company->employees()->get()->all();
        }

        // 4. Créer les menus (plats + accompagnements) si pas déjà créés
        $tier = PricingTier::where('plan_name', 'Standard')->first();
        
        if (CompanyMenu::where('pricing_tier_id', $tier->id)->count() === 0) {
            $meals = [
                'Poulet Grillé',
                'Poisson Rôti',
                'Viande Braisée',
                'Riz Pilaw',
                'Pates Bolognaise',
            ];

            $menuIds = [];
            foreach ($meals as $meal) {
                $menu = CompanyMenu::create([
                    'pricing_tier_id' => $tier->id,
                    'name' => $meal,
                    'description' => "Délicieux " . strtolower($meal),
                    'meal_type' => 'main',
                    'is_active' => true,
                ]);
                $menuIds[] = $menu->id;
            }

            // 5. Créer les accompagnements
            $sides = [
                'Riz Blanc',
                'Riz Jaune',
                'Frites',
                'Pates',
                'Légumes',
            ];

            $sideIds = [];
            foreach ($sides as $side) {
                $sideObj = MealSide::create([
                    'company_menu_id' => $menuIds[0], // Associer au premier menu
                    'name' => $side,
                    'is_active' => true,
                ]);
                $sideIds[] = $sideObj->id;
            }
        } else {
            $menuIds = CompanyMenu::where('pricing_tier_id', $tier->id)->pluck('id')->toArray();
            $sideIds = MealSide::whereIn('company_menu_id', $menuIds)->pluck('id')->toArray();
        }

        // 6. Créer un abonnement (si pas déjà créé)
        $subscription = CompanySubscription::firstOrCreate(
            [
                'company_id' => $company->id,
                'status' => 'active'
            ],
            [
                'pricing_tier_id' => $tier->id,
                'price_per_agent' => 2.50,
                'agent_count' => 15,
                'total_monthly_price' => 750.00, // 15 × 2.50 × 20
                'currency' => 'USD',
                'start_date' => now(),
                'end_date' => now()->addMonth(),
                'payment_status' => 'paid',
                'meals_provided' => 0,
                'meals_remaining' => 300, // 15 × 20
            ]
        );

        // 7. Créer les plans repas pour chaque employé (si pas déjà créés)
        if (EmployeeMealPlan::where('subscription_id', $subscription->id)->count() === 0) {
            $mealIndex = 0;
            $sideIndex = 0;
            
            foreach ($employees as $employee) {
                $mealPlan = EmployeeMealPlan::create([
                    'company_employee_id' => $employee->id,
                    'subscription_id' => $subscription->id,
                    'meal_id' => $menuIds[$mealIndex % count($menuIds)],
                    'side_id' => $sideIds[$sideIndex % count($sideIds)],
                    'valid_from' => $subscription->start_date,
                    'valid_until' => $subscription->end_date,
                    'status' => 'confirmed',
                    'meals_delivered' => 0,
                    'meals_remaining' => EmployeeMealPlan::TOTAL_MEALS,
                ]);

                // 8. Créer les logs de livraison (Mon-Fri seulement)
                $date = $subscription->start_date->copy();
                while ($date <= $subscription->end_date) {
                    // Vérifier que c'est un jour ouvrable (1=Lundi, 5=Vendredi)
                    if (in_array($date->dayOfWeek, [1, 2, 3, 4, 5])) {
                        $mealPlan->deliveryLogs()->create([
                            'company_id' => $company->id,
                            'delivery_date' => $date,
                            'day_of_week' => $this->getDayOfWeekFr($date->dayOfWeek),
                            'quantity_delivered' => 0,
                            'status' => 'pending',
                        ]);
                    }
                    $date->addDay();
                }

                $mealIndex++;
                $sideIndex++;
            }
        }

        echo "✓ Données de test créées:\n";
        echo "  - 1 Entreprise (Microsoft Kinshasa)\n";
        echo "  - 15 Employés\n";
        echo "  - 1 Abonnement (300 repas)\n";
        echo "  - 15 Plans Repas\n";
        echo "  - 300 Logs Livraison\n";
    }

    private function getDayOfWeekFr($dayOfWeek): string
    {
        return match($dayOfWeek) {
            1 => 'monday',
            2 => 'tuesday',
            3 => 'wednesday',
            4 => 'thursday',
            5 => 'friday',
            default => 'unknown',
        };
    }
}
