<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\RequireAuth;
use App\Http\Traits\RoleAccess;
use App\Models\Company;
use App\Models\CompanySubscription;
use App\Models\EmployeeMealPlan;
use App\Services\ExportService;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Contrôleur pour l'export des documents (PDF, CSV)
 */
class ExportController extends Controller
{
    use RoleAccess;

    private ExportService $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     * Télécharger le plan de livraison en PDF
     * 
     * SÉCURITÉ: Vérifier que l'utilisateur a accès à cette entreprise
     */
    public function deliveryPlanPDF(CompanySubscription $subscription)
    {
        if (!$this->canAccessCompany($subscription->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé. Vous ne pouvez exporter que les données de votre propre entreprise.',
            ], 403);
        }

        try {
            $filepath = $this->exportService->generateDeliveryPlanPDF($subscription);

            return response()->download($filepath);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Télécharger le résumé des repas en CSV
     */
    public function mealChoicesCSV(CompanySubscription $subscription)
    {
        if (!$this->canAccessCompany($subscription->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        try {
            $filepath = $this->exportService->generateMealChoicesCSV($subscription);

            return response()->download($filepath);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du CSV: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Télécharger le résumé des repas d'un employé en PDF
     */
    public function employeeMealSummaryPDF(EmployeeMealPlan $mealPlan)
    {
        // Vérifie que c'est bien l'employé ou un admin
        $isEmployee = auth()->user()->employee && auth()->user()->employee->id === $mealPlan->employee_id;
        $isAdmin = $this->hasRole('admin');

        if (!($isAdmin || $isEmployee)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        try {
            $filepath = $this->exportService->generateEmployeeMealSummaryPDF($mealPlan);

            return response()->download($filepath);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PDF liste des agents d'une entreprise (pour les livreurs).
     * Réservé à l'admin.
     */
    public function companyAgentsPDF(Company $company)
    {
        $this->requireRole('admin');

        try {
            $filepath = $this->exportService->generateCompanyAgentsPDF($company);
            return response()->download($filepath);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exporter les statistiques complètes en JSON
     */
    public function subscriptionStats(CompanySubscription $subscription)
    {
        if (!$this->canAccessCompany($subscription->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $mealPlans = $subscription->employeeMealPlans()
            ->with(['employee', 'meal', 'side', 'deliveryLogs'])
            ->get()
            ->map(function ($plan) {
                return [
                    'employee' => [
                        'id' => $plan->employee->id,
                        'full_name' => $plan->employee->full_name,
                        'matricule' => $plan->employee->matricule,
                        'function' => $plan->employee->function,
                    ],
                    'meal_plan' => [
                        'id' => $plan->id,
                        'meal' => $plan->meal->name,
                        'side' => $plan->side->name,
                        'status' => $plan->status,
                        'meals_delivered' => $plan->meals_delivered,
                        'meals_remaining' => $plan->meals_remaining,
                        'progress' => $plan->getProgressPercentage(),
                    ],
                    'delivery_stats' => [
                        'delivered' => $plan->deliveryLogs->where('status', 'delivered')->count(),
                        'pending' => $plan->deliveryLogs->where('status', 'pending')->count(),
                        'failed' => $plan->deliveryLogs->where('status', 'failed')->count(),
                    ],
                ];
            });

        return response()->json([
            'success' => true,
            'subscription' => [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'agent_count' => $subscription->agent_count,
                'total_price' => $subscription->total_monthly_price,
                'currency' => $subscription->currency,
                'start_date' => $subscription->start_date->format('Y-m-d'),
                'end_date' => $subscription->end_date->format('Y-m-d'),
            ],
            'meal_plans' => $mealPlans,
            'summary' => [
                'total_agents' => $subscription->agent_count,
                'total_meals' => $subscription->getTotalMealsForMonth(),
                'meals_delivered' => $subscription->meals_provided,
                'meals_remaining' => $subscription->meals_remaining,
                'progress_percentage' => $subscription->getTotalMealsForMonth() > 0 
                    ? ($subscription->meals_provided / $subscription->getTotalMealsForMonth()) * 100 
                    : 0,
            ],
        ]);
    }

    /**
     * Vérifier si l'utilisateur peut accéder à cette entreprise
     * 
     * SÉCURITÉ STRICTE:
     * - Admin peut accéder à toutes les entreprises
     * - Propriétaire ne peut accéder qu'à la sienne
     * - Aucune fuite de données entre entreprises
     */
    private function canAccessCompany(Company $company): bool
    {
        $user = auth()->user();

        // Admin peut voir tous
        if ($this->hasRole('admin')) {
            return true;
        }

        // Propriétaire de l'entreprise UNIQUEMENT
        if ($company->contact_user_id === $user->id) {
            return true;
        }

        // Tous les autres accès sont refusés
        return false;
    }
}
