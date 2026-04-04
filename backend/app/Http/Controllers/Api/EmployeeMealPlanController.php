<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\RequireAuth;
use App\Http\Traits\RoleAccess;
use App\Models\CompanySubscription;
use App\Models\EmployeeMealPlan;
use App\Models\CompanyEmployee;
use App\Services\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Contrôleur pour la gestion des plans de repas des employés
 * Chaque employé choisit son repas et accompagnement pour la période de 4 semaines
 */
class EmployeeMealPlanController extends Controller
{
    use RoleAccess;

    private DeliveryService $deliveryService;

    public function __construct(DeliveryService $deliveryService)
    {
        $this->deliveryService = $deliveryService;
    }

    /**
     * Lister les plans de repas de l'employé actuel
     * 
     * SÉCURITÉ: L'employé voit uniquement SES propres plans
     * Chaque employé est isolé dans sa propre entreprise
     */
    public function index(Request $request)
    {
        $this->requireAuth();

        // SÉCURITÉ: Vérifier que l'utilisateur est un employé d'entreprise
        $employee = auth()->user()->employee;

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur n\'est pas un employé d\'entreprise',
            ], 400);
        }

        // SÉCURITÉ: Filtrer STRICTEMENT par employee_id
        // L'employé ne peut voir que SES plans, pas ceux des autres employés
        $mealPlans = $employee->mealPlans()
            ->with(['subscription', 'meal', 'side', 'deliveryLogs'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $mealPlans,
        ]);
    }

    /**
     * Obtenir le plan de repas actif de l'employé
     * 
     * SÉCURITÉ: Vérifier que c'est bien l'employé authentifié
     */
    public function getActivePlan(CompanyEmployee $employee)
    {
        // SÉCURITÉ STRICTE: Vérifier que c'est bien l'employé authentifié
        if (auth()->user()->employee->id !== $employee->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé. Vous ne pouvez accéder qu\'aux données de votre propre compte.',
            ], 403);
        }

        $activePlan = $employee->mealPlans()
            ->where('status', '!=', 'completed')
            ->latest()
            ->first();

        if (!$activePlan) {
            return response()->json([
                'success' => false,
                'message' => 'Pas de plan actif',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $activePlan->load(['subscription', 'meal', 'side', 'deliveryLogs']),
        ]);
    }

    /**
     * Créer un plan de repas pour un employé
     * 
     * SÉCURITÉ: Vérifier que l'employé appartient à l'entreprise de la subscription
     */
    public function store(Request $request, CompanySubscription $subscription)
    {
        if ($r = $this->requireAnyPermission($request, ['admin.company-subscriptions', 'b2b.meal-plans.manage'])) {
            return $r;
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:company_employees,id',
            'meal_id' => 'required|exists:company_menus,id',
            'side_id' => 'required|exists:meal_sides,id',
        ]);

        $employee = \App\Models\CompanyEmployee::find($validated['employee_id']);

        // SÉCURITÉ: Vérifier que l'employé appartient BIEN à la même entreprise
        if ($employee->company_id !== $subscription->company_id) {
            return response()->json([
                'success' => false,
                'message' => 'Sécurité: Cet employé n\'appartient pas à cette entreprise. Accès refusé.',
            ], 403);
        }

        return DB::transaction(function () use ($subscription, $validated) {
            // Créer le plan
            $mealPlan = EmployeeMealPlan::create([
                'subscription_id' => $subscription->id,
                'employee_id' => $validated['employee_id'],
                'meal_id' => $validated['meal_id'],
                'side_id' => $validated['side_id'],
                'valid_from' => $subscription->start_date,
                'valid_until' => $subscription->end_date,
                'status' => 'draft',
                'meals_delivered' => 0,
                'meals_remaining' => EmployeeMealPlan::TOTAL_MEALS,
            ]);

            // Créer les logs de livraison
            $this->deliveryService->createDeliveryLogs($mealPlan);

            return response()->json([
                'success' => true,
                'message' => 'Plan de repas créé',
                'data' => $mealPlan->load(['meal', 'side', 'deliveryLogs']),
            ], 201);
        });
    }

    /**
     * Mettre à jour le choix de repas pour un plan
     */
    public function update(Request $request, EmployeeMealPlan $mealPlan)
    {
        // Vérifier que c'est bien l'employé
        if (auth()->user()->employee->id !== $mealPlan->employee_id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Les modifications sont autorisées avant confirmation
        if ($mealPlan->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier un plan ' . $mealPlan->status,
            ], 400);
        }

        $validated = $request->validate([
            'meal_id' => 'required|exists:company_menus,id',
            'side_id' => 'required|exists:meal_sides,id',
        ]);

        $mealPlan->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Plan de repas mis à jour',
            'data' => $mealPlan->load(['meal', 'side']),
        ]);
    }

    /**
     * Confirmer un plan de repas (confirme que l'employé a fait son choix)
     */
    public function confirm(EmployeeMealPlan $mealPlan)
    {
        // Vérifier que c'est bien l'employé
        if (auth()->user()->employee->id !== $mealPlan->employee_id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        if ($mealPlan->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les plans brouillon peuvent être confirmés',
            ], 400);
        }

        $mealPlan->update(['status' => 'confirmed']);

        return response()->json([
            'success' => true,
            'message' => 'Plan de repas confirmé',
            'data' => $mealPlan->load(['meal', 'side']),
        ]);
    }

    /**
     * Obtenir les statistiques detaillées d'un plan
     */
    public function stats(EmployeeMealPlan $mealPlan)
    {
        // Vérifier que c'est bien l'employé
        if (auth()->user()->employee->id !== $mealPlan->employee_id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $deliveredCount = $mealPlan->deliveryLogs()
            ->where('status', 'delivered')
            ->count();

        $pendingCount = $mealPlan->deliveryLogs()
            ->where('status', 'pending')
            ->count();

        $failedCount = $mealPlan->deliveryLogs()
            ->where('status', 'failed')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'meal_plan' => $mealPlan->load(['meal', 'side']),
                'statistics' => [
                    'total_meals' => EmployeeMealPlan::TOTAL_MEALS,
                    'meals_delivered' => $mealPlan->meals_delivered,
                    'meals_remaining' => $mealPlan->meals_remaining,
                    'progress_percentage' => $mealPlan->getProgressPercentage(),
                    'status_label' => $mealPlan->getStatusLabel(),
                    'pending_deliveries' => $pendingCount,
                    'failed_deliveries' => $failedCount,
                ],
                'next_deliveries' => $mealPlan->deliveryLogs()
                    ->where('status', 'pending')
                    ->orderBy('delivery_date')
                    ->take(5)
                    ->get(['delivery_date', 'day_of_week', 'status']),
            ],
        ]);
    }

    /**
     * Supprimer un plan (avant confirmation)
     */
    public function destroy(EmployeeMealPlan $mealPlan)
    {
        $user = auth()->user();
        $isAdminScope = $user->canAsAdmin('admin.company-subscriptions')
            || $user->hasPermissionTo('b2b.meal-plans.manage');
        $isEmployee = $user->employee && $user->employee->id === $mealPlan->employee_id;

        if (! ($isAdminScope || $isEmployee)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        if (! $isAdminScope && $mealPlan->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les brouillons peuvent être supprimés',
            ], 400);
        }

        // Supprimer les logs de livraison aussi
        $mealPlan->deliveryLogs()->delete();
        $mealPlan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Plan de repas supprimé',
        ]);
    }
}
