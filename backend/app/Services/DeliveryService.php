<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanySubscription;
use App\Models\EmployeeMealPlan;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Service de gestion des livraisons
 * Calcule les jours de livraison (Lun-Ven), génère les logs, exporte les documents
 */
class DeliveryService
{
    /**
     * Jours ouvrables mappés
     */
    private const WORKING_DAYS = [
        1 => 'monday',    // Lundi
        2 => 'tuesday',   // Mardi
        3 => 'wednesday', // Mercredi
        4 => 'thursday',  // Jeudi
        5 => 'friday',    // Vendredi
    ];

    /**
     * Génère les dates de livraison pour un plan repas (4 semaines, Lun-Ven)
     * Retourne un array de dates avec jour de la semaine
     */
    public function generateDeliveryDates(\DateTime $startDate, \DateTime $endDate): array
    {
        $dates = [];
        $period = CarbonPeriod::create($startDate, $endDate);

        foreach ($period as $date) {
            // Vérifier si c'est un jour ouvrable (Lun-Ven = 1-5)
            if (in_array($date->dayOfWeek, [1, 2, 3, 4, 5])) {
                $dates[] = [
                    'date' => $date->toDateString(),
                    'day_of_week' => self::WORKING_DAYS[$date->dayOfWeek],
                    'day_name' => $date->locale('fr')->dayName,
                ];
            }
        }

        return $dates;
    }

    /**
     * Crée les logs de livraison pour un plan repas
     */
    public function createDeliveryLogs(EmployeeMealPlan $mealPlan): Collection
    {
        $deliveryDates = $this->generateDeliveryDates(
            $mealPlan->valid_from,
            $mealPlan->valid_until
        );

        $logs = collect();

        foreach ($deliveryDates as $dateInfo) {
            $log = $mealPlan->deliveryLogs()->create([
                'company_id' => $mealPlan->employee->company_id,
                'delivery_date' => $dateInfo['date'],
                'day_of_week' => $dateInfo['day_of_week'],
                'quantity_delivered' => 0,
                'status' => 'pending',
            ]);

            $logs->push($log);
        }

        Log::info('Delivery logs created', [
            'meal_plan_id' => $mealPlan->id,
            'logs_count' => $logs->count(),
        ]);

        return $logs;
    }

    /**
     * Marque une livraison comme effectuée
     */
    public function markAsDelivered(int $deliveryLogId): void
    {
        $log = \App\Models\DeliveryLog::findOrFail($deliveryLogId);
        
        $log->update([
            'status' => 'delivered',
            'delivered_at' => now(),
            'quantity_delivered' => 1,
        ]);

        // Mettre à jour le plan repas
        $mealPlan = $log->mealPlan;
        $mealsDelivered = $mealPlan->deliveryLogs()
            ->where('status', 'delivered')
            ->count();

        $mealPlan->update([
            'meals_delivered' => $mealsDelivered,
            'meals_remaining' => EmployeeMealPlan::TOTAL_MEALS - $mealsDelivered,
            'status' => $mealsDelivered >= EmployeeMealPlan::TOTAL_MEALS ? 'completed' : 'partial_delivered',
        ]);

        // Mettre à jour la subscription
        $subscription = $mealPlan->subscription;
        $totalMealsDelivered = $subscription->employeeMealPlans()
            ->sum('meals_delivered');

        $subscription->update([
            'meals_provided' => $totalMealsDelivered,
            'meals_remaining' => $subscription->getTotalMealsForMonth() - $totalMealsDelivered,
        ]);

        Log::info('Delivery marked as delivered', [
            'delivery_log_id' => $log->id,
            'meal_plan_id' => $mealPlan->id,
            'meals_delivered' => $mealsDelivered,
        ]);
    }

    /**
     * Récupère les statistiques de livraison pour une subscription
     */
    public function getSubscriptionDeliveryStats(CompanySubscription $subscription): array
    {
        $totalMeals = $subscription->getTotalMealsForMonth();
        $delivered = $subscription->meals_provided;
        $remaining = $subscription->meals_remaining;

        return [
            'total_meals' => $totalMeals,
            'meals_delivered' => $delivered,
            'meals_remaining' => $remaining,
            'progress_percentage' => $totalMeals > 0 ? ($delivered / $totalMeals) * 100 : 0,
            'status_label' => match(true) {
                $delivered == 0 => 'Pas encore de livraisons',
                $delivered < $totalMeals => "En cours ({$delivered}/{$totalMeals})",
                $delivered >= $totalMeals => 'Complété',
            },
        ];
    }

    /**
     * Récupère les livraisons en attente pour une date
     */
    public function getPendingDeliveriesForDate(\DateTime $date, Company $company): Collection
    {
        return \App\Models\DeliveryLog::where('company_id', $company->id)
            ->where('delivery_date', $date->toDateString())
            ->where('status', 'pending')
            ->with(['mealPlan.employee', 'mealPlan.meal', 'mealPlan.side'])
            ->orderBy('created_at')
            ->get();
    }

    /**
     * Récupère toutes les livraisons en attente pour une entreprise
     */
    public function getPendingDeliveriesForCompany(Company $company): Collection
    {
        return \App\Models\DeliveryLog::where('company_id', $company->id)
            ->where('status', 'pending')
            ->whereDate('delivery_date', '>=', now())
            ->with(['mealPlan.employee', 'mealPlan.meal', 'mealPlan.side'])
            ->orderBy('delivery_date')
            ->get();
    }
}
