<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanySubscription;
use App\Models\PricingTier;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service de tarification pour les abonnements entreprise
 *
 * Formule Green Express (profil entreprise) :
 * 1,5 $ × Nombre de jours (livraison) × 4 semaines par employé.
 * Avec 5 jours/semaine : 1,5 × 5 × 4 = 30 $ / employé / mois.
 *
 * Implémentation : price_per_meal × agent_count × 20 (20 = 5 jours × 4 semaines).
 * Les tarifs changent selon le nombre d'agents (tiering).
 */
class CompanyPricingService
{
    /**
     * Obtient le tier tarifaire pour un nombre d'agents.
     * Si aucun palier ne couvre exactement ce nombre, on utilise le palier avec la plus grande
     * capacité (max_employees) pour appliquer le même prix au repas (ex. 44 agents sans palier 1-99).
     */
    public function getTierForEmployeeCount(int $count): ?PricingTier
    {
        $greenExpress = PricingTier::where('is_active', true)
            ->where('plan_name', 'Green Express')
            ->where('min_employees', '<=', $count)
            ->where('max_employees', '>=', $count)
            ->first();
        if ($greenExpress) {
            return $greenExpress;
        }
        $tier = PricingTier::where('is_active', true)
            ->where('min_employees', '<=', $count)
            ->where('max_employees', '>=', $count)
            ->orderBy('min_employees', 'desc')
            ->first();
        if ($tier) {
            return $tier;
        }
        // Fallback : aucun palier ne couvre ce nombre.
        // On utilise le palier avec le plus grand max_employees pour appliquer son prix au repas.
        $tier = PricingTier::where('is_active', true)
            ->orderBy('max_employees', 'desc')
            ->first();
        if ($tier) {
            return $tier;
        }
        // Aucun palier en base : créer le palier Green Express par défaut pour débloquer la souscription.
        return $this->ensureDefaultTier();
    }

    /**
     * Crée le palier Green Express s'il n'existe aucun palier actif (évite 400 à la souscription).
     */
    private function ensureDefaultTier(): PricingTier
    {
        $tier = PricingTier::where('plan_name', 'Green Express')->first();
        if ($tier) {
            if (!$tier->is_active) {
                $tier->update(['is_active' => true]);
            }
            return $tier;
        }
        return PricingTier::create([
            'plan_name' => 'Green Express',
            'min_employees' => 1,
            'max_employees' => 99999,
            'price_per_meal_usd' => 1.5,
            'price_per_meal_cdf' => 3750,
            'exchange_rate' => 2500,
            'currency' => 'USD',
            'description' => '1,5 $ par repas, 20 jours = 30 $ par employé/mois',
            'is_active' => true,
        ]);
    }

    /**
     * Calcule le prix mensuel pour une entreprise
     * 
     * Formula: 
     * Total = price_per_meal × agent_count × 20 (5 jours × 4 semaines)
     */
    public function calculateMonthlyPrice(
        int $agentCount,
        string $currency = 'USD'
    ): array {
        $tier = $this->getTierForEmployeeCount($agentCount);

        if (!$tier) {
            throw new \InvalidArgumentException(
                'Aucun palier tarifaire configuré. L\'administrateur doit créer au moins un palier (ex. Green Express) ou exécuter les migrations.'
            );
        }

        $pricePerMeal = $currency === 'USD' 
            ? (float) $tier->price_per_meal_usd 
            : (float) $tier->price_per_meal_cdf;

        $mealsPerAgent = 20; // 5 jours × 4 semaines
        $totalMeals = $agentCount * $mealsPerAgent;
        $totalPrice = $pricePerMeal * $totalMeals;

        return [
            'tier_id' => $tier->id,
            'tier_name' => $tier->plan_name,
            'price_per_meal' => $pricePerMeal,
            'agent_count' => $agentCount,
            'meals_per_agent' => $mealsPerAgent,
            'total_meals' => $totalMeals,
            'total_price' => round($totalPrice, 2),
            'currency' => $currency,
            'exchange_rate' => $tier->exchange_rate,
        ];
    }

    /**
     * Convertit le prix USD en CDF selon les tarifs
     */
    public function convertPrice(float $amountUsd): float
    {
        $tier = PricingTier::where('is_active', true)
            ->where('currency', 'USD')
            ->first();

        if (!$tier) {
            throw new \Exception("Taux de change non configuré");
        }

        return round($amountUsd * (float) $tier->exchange_rate, 2);
    }

    /**
     * Crée une nouvelle souscription pour une entreprise
     */
    public function createSubscription(
        Company $company,
        int $agentCount,
        string $currency = 'USD',
        ?\DateTime $startDate = null,
        ?\DateTime $endDate = null
    ): CompanySubscription {
        $startDate = $startDate ?? now();
        $endDate = $endDate ?? now()->addMonth();

        $pricing = $this->calculateMonthlyPrice($agentCount, $currency);

        return DB::transaction(function () use ($company, $pricing, $startDate, $endDate) {
            $subscription = CompanySubscription::create([
                'company_id' => $company->id,
                'pricing_tier_id' => $pricing['tier_id'],
                'price_per_agent' => $pricing['price_per_meal'],
                'agent_count' => $pricing['agent_count'],
                'total_monthly_price' => $pricing['total_price'],
                'currency' => $pricing['currency'],
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'pending',
                'payment_status' => 'pending',
                'meals_provided' => 0,
                'meals_remaining' => $pricing['total_meals'],
            ]);

            // Enregistrer dans l'historique
            $this->logSubscriptionHistory(
                $subscription,
                'created',
                null,
                $pricing['agent_count'],
                null,
                $pricing['total_price'],
                "Abonnement créé pour {$pricing['agent_count']} agents"
            );

            Log::info('Subscription created', [
                'company_id' => $company->id,
                'subscription_id' => $subscription->id,
                'pricing' => $pricing,
            ]);

            return $subscription;
        });
    }

    /**
     * Renouvelle un abonnement expiré
     */
    public function renewSubscription(
        CompanySubscription $oldSubscription,
        string $currency = 'USD'
    ): CompanySubscription {
        $company = $oldSubscription->company;
        
        // Vérifier que l'ancien est expiré
        if ($oldSubscription->status !== 'expired') {
            throw new \InvalidArgumentException("Seuls les abonnements expirés peuvent être renouvelés");
        }

        $newSubscription = $this->createSubscription(
            $company,
            $company->employee_count,
            $currency,
            now(),
            now()->addMonth()
        );

        // Marquer l'ancien comme renouvelé
        $oldSubscription->update(['status' => 'expired']);

        $this->logSubscriptionHistory(
            $newSubscription,
            'renewed',
            $oldSubscription->agent_count,
            $company->employee_count,
            $oldSubscription->total_monthly_price,
            $newSubscription->total_monthly_price,
            "Renouvelé depuis l'abonnement {$oldSubscription->id}"
        );

        Log::info('Subscription renewed', [
            'old_subscription_id' => $oldSubscription->id,
            'new_subscription_id' => $newSubscription->id,
        ]);

        return $newSubscription;
    }

    /**
     * Active un abonnement payé
     */
    public function activateSubscription(CompanySubscription $subscription): void
    {
        $subscription->update([
            'status' => 'active',
            'payment_status' => 'paid',
        ]);

        $this->logSubscriptionHistory(
            $subscription,
            'activated',
            null,
            $subscription->agent_count,
            null,
            $subscription->total_monthly_price,
            "Abonnement activé après paiement"
        );

        Log::info('Subscription activated', [
            'subscription_id' => $subscription->id,
        ]);
    }

    /**
     * Enregistre l'historique d'action sur un abonnement
     */
    private function logSubscriptionHistory(
        CompanySubscription $subscription,
        string $action,
        ?int $agentCountBefore,
        ?int $agentCountAfter,
        ?float $priceBefore,
        ?float $priceAfter,
        string $details
    ): void {
        $subscription->history()->create([
            'company_id' => $subscription->company_id,
            'action' => $action,
            'agent_count_before' => $agentCountBefore,
            'agent_count_after' => $agentCountAfter,
            'price_before' => $priceBefore,
            'price_after' => $priceAfter,
            'details' => $details,
            'performed_by' => auth()->id(),
        ]);
    }
}
