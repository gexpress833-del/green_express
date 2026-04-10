<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanySubscription;
use App\Models\EmployeeMealPlan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

/**
 * Service pour exporter les documents de livraison en PDF
 * Contient la liste détaillée des choix de repas pour chaque agent
 */
class ExportService
{
    /**
     * Génère un PDF avec le plan de livraison pour une subscription
     * 
     * Format:
     * Semaine 1 (jours)
     *   - Agent 001 (Nom) | Fonction | Repas | Accompagnement
     *   - Agent 002 ...
     * Semaine 2 ...
     */
    public function generateDeliveryPlanPDF(CompanySubscription $subscription): string
    {
        $company = $subscription->company;
        $mealPlans = $subscription->employeeMealPlans()
            ->with(['employee', 'meal', 'side'])
            ->get();

        // Grouper par semaine
        $weeks = $this->groupMealPlansByWeek($mealPlans, $subscription->start_date, $subscription->end_date);

        $data = [
            'company' => $company,
            'subscription' => $subscription,
            'weeks' => $weeks,
            'generated_at' => now()->locale('fr')->format('d F Y à H:i'),
            'total_meals' => $subscription->getTotalMealsForMonth(),
            'meals_provided' => $subscription->meals_provided,
            'meals_remaining' => $subscription->meals_remaining,
        ];

        $pdf = Pdf::loadView('exports.delivery-plan', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10);

        $filename = "plan_livraison_{$company->id}_{$subscription->id}_" . now()->format('Y-m-d') . ".pdf";
        $filepath = storage_path("app/exports/{$filename}");

        // Créer le répertoire s'il n'existe pas
        if (!file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        $pdf->save($filepath);

        Log::info('Delivery plan PDF generated', [
            'company_id' => $company->id,
            'subscription_id' => $subscription->id,
            'filename' => $filename,
        ]);

        return $filepath;
    }

    /**
     * Génère un PDF avec le résumé pour un agent
     */
    public function generateEmployeeMealSummaryPDF(EmployeeMealPlan $mealPlan): string
    {
        $data = [
            'employee' => $mealPlan->employee,
            'meal_plan' => $mealPlan,
            'company' => $mealPlan->employee->company,
            'delivered_dates' => $mealPlan->deliveryLogs()
                ->where('status', 'delivered')
                ->orderBy('delivery_date')
                ->get(),
            'pending_dates' => $mealPlan->deliveryLogs()
                ->where('status', 'pending')
                ->orderBy('delivery_date')
                ->get(),
        ];

        $pdf = Pdf::loadView('exports.employee-meal-summary', $data)
            ->setPaper('a4');

        $filename = "resume_repas_{$mealPlan->employee->id}_{$mealPlan->subscription_id}.pdf";
        $filepath = storage_path("app/exports/{$filename}");

        if (!file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        $pdf->save($filepath);

        return $filepath;
    }

    /**
     * Génère un CSV avec tous les choix pour import/export
     */
    public function generateMealChoicesCSV(CompanySubscription $subscription): string
    {
        $filename = "choix_repas_{$subscription->company_id}_{$subscription->id}_" . now()->format('Y-m-d') . ".csv";
        $filepath = storage_path("app/exports/{$filename}");

        if (!file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        $file = fopen($filepath, 'w');

        // Headers
        fputcsv($file, [
            'Matricule',
            'Nom Complet',
            'Fonction',
            'Email',
            'Repas Choisi',
            'Accompagnement',
            'Période',
            'Statut',
            'Repas Livrés',
            'Repas Restants',
        ], ';');

        // Data
        $mealPlans = $subscription->employeeMealPlans()
            ->with(['employee', 'meal', 'side'])
            ->get();

        foreach ($mealPlans as $plan) {
            fputcsv($file, [
                $plan->employee->matricule,
                $plan->employee->full_name,
                $plan->employee->getFunctionLabel(),
                $plan->employee->email,
                $plan->meal->name,
                $plan->side->name,
                $plan->valid_from->format('d/m/Y') . ' - ' . $plan->valid_until->format('d/m/Y'),
                $plan->getStatusLabel(),
                $plan->meals_delivered,
                $plan->meals_remaining,
            ], ';');
        }

        fclose($file);

        Log::info('Meal choices CSV generated', [
            'subscription_id' => $subscription->id,
            'filename' => $filename,
        ]);

        return $filepath;
    }

    /**
     * Génère un PDF liste des agents d'une entreprise (pour les livreurs).
     * Utilise la liste de référence (pending_employees) avec codes uniques C{company_id}-E{index}.
     * Aucun compte agent : liste servant uniquement à identifier les personnes à servir lors de la livraison.
     */
    public function generateCompanyAgentsPDF(Company $company): string
    {
        $list = $company->pending_employees ?? [];
        $employees = collect($list)->map(function ($item, $index) use ($company) {
            $obj = new \stdClass();
            $obj->matricule = $item['matricule'] ?? ('C' . $company->id . '-E' . ($index + 1));
            $obj->full_name = $item['full_name'] ?? (is_string($item) ? $item : 'Agent ' . ($index + 1));
            $obj->function = $item['function'] ?? '—';
            $obj->phone = $item['phone'] ?? '—';
            $obj->email = '—';
            return $obj;
        })->sortBy('matricule')->values();

        $data = [
            'company' => $company,
            'employees' => $employees,
            'generated_at' => now()->locale('fr')->format('d/m/Y à H:i'),
        ];

        $pdf = Pdf::loadView('exports.company-agents-list', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 12)
            ->setOption('margin-bottom', 12)
            ->setOption('margin-left', 12)
            ->setOption('margin-right', 12);

        $filename = "liste_agents_{$company->id}_" . now()->format('Y-m-d') . ".pdf";
        $filepath = storage_path("app/exports/{$filename}");

        if (!file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        $pdf->save($filepath);

        Log::info('Company agents list PDF generated', [
            'company_id' => $company->id,
            'filename' => $filename,
        ]);

        return $filepath;
    }

    /**
     * Groupe les plans repas par semaine
     */
    private function groupMealPlansByWeek($mealPlans, $startDate, $endDate): array
    {
        $weeks = [];
        $currentWeek = 1;
        $weekStart = \Carbon\Carbon::parse($startDate);

        for ($i = 0; $i < 4; $i++) {
            $weekEnd = (clone $weekStart)->addDays(6);
            
            $weeks[] = [
                'week_number' => $currentWeek,
                'start_date' => $weekStart->format('d/m/Y'),
                'end_date' => MIN($weekEnd, \Carbon\Carbon::parse($endDate))->format('d/m/Y'),
                'meal_plans' => $mealPlans, // Même repas tous les jours
            ];

            $weekStart->addWeek();
            $currentWeek++;
        }

        return $weeks;
    }
}
