<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /** Images stables (picsum, graine fixe) — remplacez par vos visuels Cloudinary depuis l’admin. */
    private static function img(string $seed): string
    {
        return 'https://picsum.photos/seed/'.rawurlencode($seed).'/640/480';
    }

    private static function weekdays(): array
    {
        return ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    }

    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basique',
                'description' => 'Formule d’accès pour une semaine de travail (lundi à vendredi) : un déjeuner structuré chaque jour ouvré, pensé pour une alimentation équilibrée au rythme du bureau.',
                'plan_scope' => SubscriptionPlan::SCOPE_INDIVIDUAL,
                'meal_types' => [
                    [
                        'label' => 'Déjeuner',
                        'detail' => 'Mise en assiette complète : protéine, féculent, légumes de saison et boisson — renouvelée chaque jour ouvré.',
                        'emoji' => '🍽️',
                    ],
                ],
                'highlights' => [
                    'Cinq jours ouvrés par cycle (lundi–vendredi, hors week-end)',
                    'Une même structure de repas, avec une rotation hebdomadaire des recettes',
                    'Renouvellement par période hebdomadaire',
                ],
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
                'description' => 'Pour chaque jour ouvré, deux temps forts : le midi et le soir. Une couverture alimentaire complète sans charge cognitive pour l’organisation des repas.',
                'plan_scope' => SubscriptionPlan::SCOPE_INDIVIDUAL,
                'meal_types' => [
                    [
                        'label' => 'Déjeuner',
                        'detail' => 'Proposition du jour, garniture et boisson — alignée sur le calendrier des jours ouvrés.',
                        'emoji' => '☀️',
                    ],
                    [
                        'label' => 'Dîner',
                        'detail' => 'Repas du soir dosé en calories et en volume pour une fin de journée confortable.',
                        'emoji' => '🌙',
                    ],
                ],
                'highlights' => [
                    'Dix prestations repas par semaine (deux par jour sur cinq jours ouvrés)',
                    'Tarification et engagement exprimés à la semaine',
                    'Formule la plus demandée par nos clients particuliers',
                ],
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
                'description' => 'L’offre la plus étendue : déjeuner, dîner et collation structurée, pour une couverture nutritionnelle continue sur l’ensemble de la journée ouvrée.',
                'plan_scope' => SubscriptionPlan::SCOPE_INDIVIDUAL,
                'meal_types' => [
                    [
                        'label' => 'Déjeuner',
                        'detail' => 'Carte du chef, portions adaptées, alternative végétarienne sur demande.',
                        'emoji' => '☀️',
                    ],
                    [
                        'label' => 'Dîner',
                        'detail' => 'Service complet incluant une note sucrée légère en fin de repas.',
                        'emoji' => '🌙',
                    ],
                    [
                        'label' => 'Collation',
                        'detail' => 'Boisson et encas pour l’après-midi, calibrés sur la même semaine ouvrée.',
                        'emoji' => '🥤',
                    ],
                ],
                'highlights' => [
                    'Quinze prestations repas par semaine (trois par jour sur cinq jours ouvrés)',
                    'Priorité sur les créneaux de livraison',
                    'Carte renouvelée chaque semaine calendaire',
                ],
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
            $model = SubscriptionPlan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
            $this->syncDemoItems($model);
        }
    }

    private function syncDemoItems(SubscriptionPlan $plan): void
    {
        $plan->items()->delete();

        $days = self::weekdays();
        $rows = [];

        foreach ($days as $i => $day) {
            $n = $i + 1;
            $rows[] = match ($plan->name) {
                'Basique' => [
                    'title' => 'Déjeuner — variante du '.$day,
                    'description' => 'Assiette structurée : protéine, féculent et légumes ; composition adaptée à la rotation hebdomadaire.',
                    'image' => self::img('gx-bas-'.$n),
                    'meal_slot' => $day,
                    'sort_order' => $i,
                ],
                'Standard' => [
                    'title' => $day.' · midi et soir',
                    'description' => 'Déjeuner : plat du jour et accompagnement. Dîner : repas chaud équilibré, portions adaptées au soir.',
                    'image' => self::img('gx-std-'.$n),
                    'meal_slot' => $day,
                    'sort_order' => $i,
                ],
                'Premium' => [
                    'title' => $day.' · formule intégrale',
                    'description' => 'Déjeuner (carte du chef), dîner avec note sucrée légère, collation après-midi — trois temps sur la journée ouvrée.',
                    'image' => self::img('gx-pre-'.$n),
                    'meal_slot' => $day,
                    'sort_order' => $i,
                ],
                default => null,
            };
        }

        foreach ($rows as $row) {
            if ($row !== null) {
                $plan->items()->create($row);
            }
        }
    }
}
