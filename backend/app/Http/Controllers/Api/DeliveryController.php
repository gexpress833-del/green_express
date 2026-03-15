<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\RequireAuth;
use App\Http\Traits\RoleAccess;
use App\Models\Company;
use App\Models\CompanySubscription;
use App\Models\DeliveryLog;
use App\Services\DeliveryService;
use Illuminate\Http\Request;

/**
 * Contrôleur pour la gestion des livraisons
 * Suivi de l'historique, marking comme livré, etc.
 */
class DeliveryController extends Controller
{
    use RoleAccess;

    private DeliveryService $deliveryService;

    public function __construct(DeliveryService $deliveryService)
    {
        $this->deliveryService = $deliveryService;
    }

    /**
     * Lister les livraisons en attente pour une entreprise
     * 
     * SÉCURITÉ: Filtré strictement par company_id
     * Une entreprise ne peut voir que SES propres livraisons
     */
    public function pending(Company $company, Request $request)
    {
        if (!$this->canAccessCompany($company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé. Vous ne pouvez accéder qu\'aux livraisons de votre propre entreprise.',
            ], 403);
        }

        // SÉCURITÉ: Filtre STRICT par company_id
        $query = $this->deliveryService->getPendingDeliveriesForCompany($company);

        // Filtrer par date si fournie
        if ($request->date) {
            $query->whereDate('delivery_date', $request->date);
        }

        $deliveries = $query->get();

        return response()->json([
            'success' => true,
            'count' => $deliveries->count(),
            'data' => $deliveries,
        ]);
    }

    /**
     * Lister les livraisons pour une date spécifique
     */
    public function byDate(Company $company, Request $request)
    {
        if (!$this->canAccessCompany($company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        $date = \Carbon\Carbon::parse($validated['date']);
        $deliveries = $this->deliveryService->getPendingDeliveriesForDate($date, $company);

        return response()->json([
            'success' => true,
            'date' => $date->format('Y-m-d'),
            'day_name' => $date->locale('fr')->dayName,
            'count' => $deliveries->count(),
            'data' => $deliveries,
        ]);
    }

    /**
     * Marquer une livraison comme effectuée
     */
    public function markDelivered(DeliveryLog $delivery, Request $request)
    {
        $this->requireRole('admin', 'livreur');

        if (!$this->canAccessCompany($delivery->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Vérifier que la livraison est en attente
        if ($delivery->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette livraison a déjà été traitée',
            ], 400);
        }

        $this->deliveryService->markAsDelivered($delivery->id);

        return response()->json([
            'success' => true,
            'message' => 'Livraison marquée comme effectuée',
            'data' => $delivery->fresh(['mealPlan.employee', 'mealPlan.meal']),
        ]);
    }

    /**
     * Marquer une livraison comme échouée
     */
    public function markFailed(DeliveryLog $delivery, Request $request)
    {
        $this->requireRole('admin', 'livreur');

        if (!$this->canAccessCompany($delivery->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $validated = $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $delivery->update([
            'status' => 'failed',
            'notes' => $validated['notes'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Livraison marquée comme échouée',
            'data' => $delivery,
        ]);
    }

    /**
     * Lister l'historique complet des livraisons pour une subscription
     */
    public function subscriptionHistory(CompanySubscription $subscription, Request $request)
    {
        if (!$this->canAccessCompany($subscription->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $logs = $subscription->deliveryLogs()
            ->with(['mealPlan.employee', 'mealPlan.meal', 'mealPlan.side'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->start_date, fn($q) => $q->whereDate('delivery_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('delivery_date', '<=', $request->end_date))
            ->orderBy('delivery_date')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Statistiques de livraison pour une subscription
     */
    public function stats(CompanySubscription $subscription)
    {
        if (!$this->canAccessCompany($subscription->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $stats = $this->deliveryService->getSubscriptionDeliveryStats($subscription);

        // Ajouter résumé par statut
        $statusSummary = $subscription->deliveryLogs()
            ->groupBy('status')
            ->selectRaw('status, COUNT(*) as count')
            ->pluck('count', 'status');

        return response()->json([
            'success' => true,
            'data' => [
                'overall' => $stats,
                'by_status' => $statusSummary,
                'by_day_of_week' => $subscription->deliveryLogs()
                    ->groupBy('day_of_week')
                    ->selectRaw('day_of_week, COUNT(*) as count')
                    ->pluck('count', 'day_of_week'),
            ],
        ]);
    }

    /**
     * Obtenir les livraisons pour un employé
     */
    public function employeeDeliveries(\App\Models\CompanyEmployee $employee)
    {
        // L'employé voit uniquement ses propres livraisons
        if (auth()->user()->employee && auth()->user()->employee->id !== $employee->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $activeMealPlan = $employee->currentMealPlan();

        if (!$activeMealPlan) {
            return response()->json([
                'success' => false,
                'message' => 'Pas de plan actif',
            ], 404);
        }

        $deliveries = $activeMealPlan->deliveryLogs()
            ->orderBy('delivery_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'meal_plan' => $activeMealPlan->load(['meal', 'side']),
                'deliveries' => $deliveries,
            ],
        ]);
    }

    /**
     * Vérifier si l'utilisateur peut accéder à cette entreprise
     * 
     * SÉCURITÉ STRICTE:
     * - Admin peut accéder à toutes les entreprises
     * - Livreur peut marquer les livraisons de toutes les entreprises
     * - Propriétaire entreprise ne peut voir que la sienne
     * - Tous les autres accès sont refusés
     */
    private function canAccessCompany(Company $company): bool
    {
        $user = auth()->user();

        // Admin et livreur peuvent voir tous
        if ($this->hasRole('admin', 'livreur')) {
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
