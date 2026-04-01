<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\RequireAuth;
use App\Http\Traits\RoleAccess;
use App\Models\Company;
use App\Models\CompanySubscription;
use App\Services\CompanyPricingService;
use App\Services\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Contrôleur pour la gestion des abonnements d'entreprise
 */
class CompanySubscriptionController extends Controller
{
    use RoleAccess;

    private CompanyPricingService $pricingService;
    private DeliveryService $deliveryService;

    public function __construct(
        CompanyPricingService $pricingService,
        DeliveryService $deliveryService
    ) {
        $this->pricingService = $pricingService;
        $this->deliveryService = $deliveryService;
    }

    /**
     * Lister tous les abonnements entreprise (admin) pour activation et gestion
     */
    public function adminIndex(Request $request)
    {
        $this->requireRole('admin');

        $subscriptions = CompanySubscription::with(['company.contactUser', 'pricingTier'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $subscriptions,
        ]);
    }

    /**
     * Lister les abonnements d'une entreprise
     * 
     * SÉCURITÉ: Vérifier que l'utilisateur a accès à cette entreprise
     */
    public function index(Company $company)
    {
        // SÉCURITÉ: Vérifier l'accès
        if (!$this->canAccessCompany($company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé. Vous ne pouvez accéder qu\'aux abonnéments de votre propre entreprise.',
            ], 403);
        }

        try {
            $subscriptions = $company->subscriptions()
                ->with([
                    'pricingTier',
                    'history' => fn($q) => $q->latest()->limit(5),
                ])
                ->latest()
                ->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $subscriptions,
            ]);
        } catch (\Throwable $e) {
            Log::error('CompanySubscription index failed', [
                'company_id' => $company->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des abonnements.',
            ], 500);
        }
    }

    /**
     * Obtenir les détails d'un abonnement
     * 
     * SÉCURITÉ: Vérifier que l'utilisateur a accès à cette entreprise
     */
    public function show(CompanySubscription $subscription)
    {
        $company = $subscription->company;

        if (!$this->canAccessCompany($company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé. Vous ne pouvez accéder qu\'aux abonnéments de votre propre entreprise.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $subscription->load([
                'company',
                'pricingTier',
                'employeeMealPlans' => fn($q) => $q->with(['employee', 'meal', 'side', 'deliveryLogs']),
                'history',
                'deliveryLogs' => fn($q) => $q->latest()->limit(20),
            ]),
        ]);
    }

    /**
     * Créer un nouvel abonnement pour une entreprise.
     * Règle : un seul abonnement actif ou en attente par entreprise.
     * Renouvellement possible uniquement après expiration de l'abonnement actuel.
     */
    public function store(Request $request, Company $company)
    {
        $this->requireRole('admin', 'entreprise');

        if (!$this->canAccessCompany($company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Un seul abonnement actif ou en attente par entreprise
        if ($company->subscriptions()->whereIn('status', ['active', 'pending'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Un abonnement est déjà en cours pour cette entreprise. Le renouvellement n\'est possible qu\'après expiration de l\'abonnement actuel.',
            ], 422);
        }

        $user = auth()->user();
        $employeeCount = null;
        if ($this->hasRole('entreprise')) {
            // L'entreprise ne peut souscrire que pour elle-même, avec son nombre d'agents
            if ($company->contact_user_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
            }
            // Liste des agents prise en charge uniquement après validation admin : on utilise la liste officielle (pending_employees) seulement si l'entreprise est active
            if ($company->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre entreprise doit être validée par l\'administrateur avant de souscrire. La liste des agents et le calcul de l\'abonnement ne sont pris en charge qu\'après validation.',
                ], 422);
            }
            $pendingList = is_array($company->pending_employees) ? $company->pending_employees : [];
            $employeeCount = count($pendingList) > 0 ? count($pendingList) : (int) ($company->employee_count ?? $company->employees()->count());
            if ($employeeCount < 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun agent enregistré. L\'administrateur doit valider l\'entreprise et renseigner la liste des agents (identités complètes) pour permettre la souscription.',
                ], 422);
            }
        }

        $validated = $request->validate([
            'currency' => 'required|in:USD,CDF',
            'employee_count' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        if ($this->hasRole('admin') && isset($validated['employee_count'])) {
            $employeeCount = $validated['employee_count'];
        }
        if ($employeeCount === null || $employeeCount < 1) {
            return response()->json([
                'success' => false,
                'message' => 'Le nombre d\'employés est requis (admin) ou doit être renseigné sur l\'entreprise.',
            ], 422);
        }

        try {
            $subscription = $this->pricingService->createSubscription(
                $company,
                $employeeCount,
                $validated['currency'],
                !empty($validated['start_date']) ? now()->parse($validated['start_date']) : null,
                !empty($validated['end_date']) ? now()->parse($validated['end_date']) : null
            );

            return response()->json([
                'success' => true,
                'message' => 'Abonnement créé. En attente de paiement et d\'activation par l\'administrateur.',
                'data' => $subscription->load('pricingTier', 'history'),
            ], 201);
        } catch (\Throwable $e) {
            Log::warning('CompanySubscription store failed', [
                'company_id' => $company->id,
                'message' => $e->getMessage(),
            ]);
            $message = ($e instanceof \InvalidArgumentException || str_contains($e->getMessage(), 'palier'))
                ? $e->getMessage()
                : 'Impossible de créer l\'abonnement pour le moment. Veuillez réessayer ou contacter l\'administrateur.';
            return response()->json([
                'success' => false,
                'message' => $message,
            ], 400);
        }
    }

    /**
     * Activer un abonnement entreprise après paiement (admin).
     * Route préférée : POST /api/admin/company-subscriptions/{companySubscription}/activate
     */
    public function adminActivate(Request $request, CompanySubscription $companySubscription)
    {
        $this->requireRole('admin');

        return $this->performCompanySubscriptionActivate($companySubscription);
    }

    /**
     * @deprecated Utiliser adminActivate — conservé pour compat. clients qui appellent encore cette URL.
     */
    public function activate(Request $request, CompanySubscription $subscription)
    {
        $this->requireRole('admin');

        return $this->performCompanySubscriptionActivate($subscription);
    }

    /**
     * Verrouille une seule ligne company_subscriptions puis active (évite les courses / modèles résolus hors scope).
     */
    private function performCompanySubscriptionActivate(CompanySubscription $subscription): \Illuminate\Http\JsonResponse
    {
        return DB::transaction(function () use ($subscription) {
            $locked = CompanySubscription::query()
                ->whereKey($subscription->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $this->pricingService->activateSubscription($locked);

            $locked->employeeMealPlans()->each(function ($mealPlan) {
                $this->deliveryService->createDeliveryLogs($mealPlan);
            });

            return response()->json([
                'success' => true,
                'message' => 'Abonnement activé',
                'data' => $locked->fresh()->load('pricingTier'),
            ]);
        });
    }

    /**
     * Renouveler un abonnement expiré
     */
    public function renew(Request $request, CompanySubscription $subscription)
    {
        $this->requireRole('admin', 'entreprise');

        if (!$this->canAccessCompany($subscription->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        try {
            $newSubscription = $this->pricingService->renewSubscription(
                $subscription,
                $request->input('currency', 'USD')
            );

            return response()->json([
                'success' => true,
                'message' => 'Abonnement renouvelé',
                'data' => $newSubscription->load('pricingTier'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Obtenir les statistiques de livraison
     */
    public function deliveryStats(CompanySubscription $subscription)
    {
        if (!$this->canAccessCompany($subscription->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $stats = $this->deliveryService->getSubscriptionDeliveryStats($subscription);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Vérifier si l'utilisateur peut accéder à cette entreprise
     * 
     * SÉCURITÉ STRICTE:
     * - Admin peut accéder à toutes les entreprises
     * - Propriétaire entreprise ne peut voir que la sienne
     * - Tous les autres accès sont refusés
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
