<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\AdminRequiresPermission;
use App\Http\Traits\RequireAuth;
use App\Http\Traits\RoleAccess;
use App\Models\Company;
use App\Models\CompanySubscription;
use App\Models\Payment;
use App\Services\CompanyPricingService;
use App\Services\FlexPayService;
use App\Services\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Contrôleur pour la gestion des abonnements d'entreprise
 */
class CompanySubscriptionController extends Controller
{
    use AdminRequiresPermission;
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
        if ($r = $this->adminRequires($request, 'admin.company-subscriptions')) {
            return $r;
        }

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
        if ($r = $this->requireAnyPermission($request, ['admin.company-subscriptions', 'entreprise.b2b.access'])) {
            return $r;
        }

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
        if ($user->hasPermissionTo('entreprise.b2b.access') && ! $user->canAsAdmin('admin.company-subscriptions')) {
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

        if ($user->canAsAdmin('admin.company-subscriptions') && isset($validated['employee_count'])) {
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
     * Entreprise ou admin : initier un paiement par carte (Visa/Mastercard via FlexPay) pour un abonnement B2B en attente.
     */
    public function initiateCardPayment(Request $request, Company $company, CompanySubscription $subscription)
    {
        if ($r = $this->requireAnyPermission($request, ['admin.company-subscriptions', 'entreprise.b2b.access'])) {
            return $r;
        }

        if (! $this->canAccessCompany($company)) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        if ((int) $subscription->company_id !== (int) $company->id) {
            return response()->json(['success' => false, 'message' => 'Abonnement introuvable.'], 404);
        }

        $user = $request->user();
        if ($user && $user->hasPermissionTo('entreprise.b2b.access') && ! $user->canAsAdmin('admin.company-subscriptions')) {
            if ((int) $company->contact_user_id !== (int) $user->id) {
                return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
            }
        }

        if ($subscription->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Seul un abonnement en attente d\'activation peut être payé en ligne.',
            ], 422);
        }

        if ($subscription->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Le paiement de cet abonnement est déjà enregistré.',
            ], 422);
        }

        try {
            $flexPay = app(FlexPayService::class);
            if (! $flexPay->isConfigured()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paiement par carte temporairement indisponible.',
                    'error' => 'payment_not_configured',
                ], 503);
            }

            $resolved = $flexPay->resolveAmountAndCurrency(
                (float) $subscription->total_monthly_price,
                (string) $subscription->currency
            );

            $reference = $flexPay->buildCompanyCardReference($subscription->id);
            $flexResponse = $flexPay->initiateCardPayment(
                $resolved['amount'],
                $resolved['currency'],
                $reference,
                'Abonnement entreprise #'.$subscription->id,
                null
            );

            $payment = Payment::create([
                'company_subscription_id' => $subscription->id,
                'order_id' => null,
                'subscription_id' => null,
                'provider' => 'flexpay',
                'provider_payment_id' => $flexResponse['id'],
                'reference_id' => $flexResponse['referenceId'] ?? $reference,
                'amount' => $flexResponse['amount'] ?? $resolved['amount'],
                'currency' => $flexResponse['currency'] ?? $resolved['currency'],
                'phone' => null,
                'status' => 'pending',
                'raw_response' => array_merge(
                    is_array($flexResponse['raw'] ?? null) ? $flexResponse['raw'] : [],
                    ['channel' => 'card']
                ),
            ]);

            return response()->json([
                'success' => true,
                'payment' => $payment,
                'redirect_url' => $flexResponse['url'],
                'message' => 'Redirection vers le paiement sécurisé par carte.',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Company subscription card payment failed', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Impossible d\'initier le paiement par carte.',
            ], 400);
        }
    }

    /**
     * Activer un abonnement entreprise après paiement (admin).
     * Route préférée : POST /api/admin/company-subscriptions/{companySubscription}/activate
     */
    public function adminActivate(Request $request, CompanySubscription $companySubscription)
    {
        if ($r = $this->adminRequires($request, 'admin.company-subscriptions')) {
            return $r;
        }

        return $this->performCompanySubscriptionActivate($companySubscription);
    }

    /**
     * @deprecated Utiliser adminActivate — conservé pour compat. clients qui appellent encore cette URL.
     */
    public function activate(Request $request, CompanySubscription $subscription)
    {
        if ($r = $this->adminRequires($request, 'admin.company-subscriptions')) {
            return $r;
        }

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
        if ($r = $this->requireAnyPermission($request, ['admin.company-subscriptions', 'entreprise.b2b.access'])) {
            return $r;
        }

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

        if ($user && $user->canAsAdmin('admin.company-subscriptions')) {
            return true;
        }

        if ($user && $company->contact_user_id === $user->id && $user->hasPermissionTo('entreprise.b2b.access')) {
            return true;
        }

        // Tous les autres accès sont refusés
        return false;
    }
}
