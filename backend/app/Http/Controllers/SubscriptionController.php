<?php

namespace App\Http\Controllers;

use App\Http\Traits\AdminRequiresPermission;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\AppNotificationService;
use App\Services\FlexPayService;
use App\Services\PhoneRDCService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    use AdminRequiresPermission;

    public function __construct(private AppNotificationService $appNotifications)
    {
    }

    /**
     * Liste des abonnements (admin: tous avec user + plan, client: les siens).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Subscription::with([
            'user:id,name,email',
            'subscriptionPlan' => fn ($q) => $q->with(['items' => fn ($iq) => $iq->orderBy('sort_order')->limit(8)]),
        ])->orderByDesc('created_at');

        if (! $user->canAsAdmin('admin.subscriptions')) {
            $query->where('user_id', $user->id);
        }

        $list = $query->get();

        if ($user->canAsAdmin('admin.subscriptions')) {
            $list->each(function (Subscription $sub) {
                $sub->has_payment_received = Payment::where('subscription_id', $sub->id)
                    ->whereIn('status', ['completed', 'paid'])->exists();
            });
        } else {
            $list->each(function (Subscription $sub) {
                $sub->days_until_expiry = $sub->daysUntilExpiry();
                $sub->days_until_start = $sub->daysUntilStart();
                $sub->has_payment_received = Payment::where('subscription_id', $sub->id)
                    ->whereIn('status', ['completed', 'paid'])->exists();
            });
        }

        return $list;
    }

    /**
     * Client : demande de souscription (status = pending). L'admin validera ou rejettera après vérification du paiement.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'period' => 'required|in:week',
        ]);

        $plan = SubscriptionPlan::findOrFail($data['subscription_plan_id']);
        if (!$plan->is_active) {
            return response()->json(['message' => 'Ce plan n\'est plus disponible.'], 400);
        }

        $userId = $request->user()->id;
        $hasOngoing = Subscription::where('user_id', $userId)
            ->whereIn('status', [Subscription::STATUS_PENDING, Subscription::STATUS_SCHEDULED, Subscription::STATUS_ACTIVE])
            ->exists();
        if ($hasOngoing) {
            return response()->json(['message' => 'Vous avez déjà un abonnement en cours (en attente ou actif). Vous ne pouvez pas souscrire à un autre tant qu\'il n\'est pas expiré ou traité.'], 400);
        }

        $period = 'week';
        $price = (float) $plan->price_week;

        $sub = Subscription::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $request->user()->id,
            'subscription_plan_id' => $plan->id,
            'plan' => $plan->name,
            'price' => $price,
            'period' => $period,
            'currency' => $plan->currency ?? 'CDF',
            'status' => Subscription::STATUS_PENDING,
            'started_at' => null,
            'expires_at' => null,
        ]);

        return response()->json($sub->load('subscriptionPlan'), 201);
    }

    /**
     * Client : initier un paiement FlexPay (Mobile Money RDC) pour un abonnement en attente.
     */
    public function initiatePayment(Request $request, int $id)
    {
        $subscription = Subscription::findOrFail($id);
        $user = $request->user();

        if ($subscription->user_id !== $user->id && ! $user->canAsAdmin('admin.subscriptions')) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }
        if (! $subscription->isPending()) {
            return response()->json(['message' => 'Cet abonnement n\'est plus en attente de paiement.'], 400);
        }

        $data = $request->validate([
            'client_phone_number' => 'required|string',
            'country_code' => 'required|string|in:DRC',
        ]);

        try {
            $flexPay = app(FlexPayService::class);
            if (! $flexPay->isConfigured()) {
                return response()->json([
                    'message' => 'Paiement Mobile Money temporairement indisponible. Réessayez plus tard ou contactez le support.',
                    'error' => 'payment_not_configured',
                ], 503);
            }

            $formatted = PhoneRDCService::formatPhoneRDC($data['client_phone_number']);
            if (! PhoneRDCService::isValidPhoneRDC($formatted)) {
                return response()->json([
                    'message' => 'Numéro invalide pour la RDC.',
                    'error' => 'Numéro invalide',
                ], 400);
            }
            $phoneNormalized = PhoneRDCService::toE164($formatted);
            $phone12 = $formatted;

            $operator = PhoneRDCService::detectOperatorRDC($formatted);
            if ($operator === null) {
                return response()->json([
                    'message' => 'Opérateur non reconnu. Utilisez un numéro Vodacom (81–83), Airtel (97–99), Orange (84, 85, 89) ou Afrimoney / Africell (90–91).',
                    'error' => 'Opérateur non reconnu',
                ], 400);
            }

            $subCurrency = $subscription->currency ?? 'CDF';
            $resolved = $flexPay->resolveAmountAndCurrency((float) $subscription->price, (string) $subCurrency);

            $reference = 'SUB-' . $subscription->id . '-' . Str::lower(Str::random(12));

            $callbackUrl = config('flexpay.callback_url')
                ?: (rtrim(config('app.url'), '/') . '/api/flexpay/callback');

            $flexResponse = $flexPay->initiateMobilePayment(
                $resolved['amount'],
                $resolved['currency'],
                $phone12,
                $reference,
                'Abonnement #' . $subscription->id,
                $callbackUrl
            );

            $payment = Payment::create([
                'subscription_id' => $subscription->id,
                'order_id' => null,
                'provider' => 'flexpay',
                'provider_payment_id' => $flexResponse['id'],
                'reference_id' => $flexResponse['referenceId'] ?? $reference,
                'amount' => $flexResponse['amount'] ?? $subscription->price,
                'currency' => $flexResponse['currency'] ?? $resolved['currency'],
                'phone' => $phoneNormalized,
                'status' => 'pending',
                'raw_response' => $flexResponse,
            ]);

            return response()->json([
                'subscription' => $subscription->fresh()->load('subscriptionPlan'),
                'payment' => $payment,
                'flexpay_transaction' => $flexResponse,
                'amount_to_debit' => $resolved['amount'],
                'currency_to_debit' => $resolved['currency'],
                'message' => 'Paiement initié. En attente de confirmation sur votre mobile.',
                'payment_completed' => false,
                'operator' => $operator,
                'operator_label' => PhoneRDCService::operatorLabel($operator),
                'phone_formatted' => $phoneNormalized,
            ]);
        } catch (\Throwable $e) {
            Log::warning('FlexPay subscription payment failed', [
                'subscription_id' => $id,
                'error' => $e->getMessage(),
            ]);

            $message = $e->getMessage();
            $message = preg_replace('/\bFlexPay\b|\bFlexPaie\b/ui', 'le service de paiement', $message);
            if (stripos($message, 'destination number') !== false || stripos($message, 'number you have entered is invalid') !== false) {
                $message = 'Votre opérateur Mobile Money refuse le numéro. Utilisez 9 chiffres après +243 (ex: +243812345678 ou 0812345678).';
            } elseif (stripos($message, 'minimum') !== false && stripos($message, 'CDF') !== false) {
                $message = 'Le montant minimum pour un paiement Mobile Money en CDF n’est pas atteint pour cet abonnement.';
            }

            return response()->json([
                'message' => $message,
                'error' => $message,
            ], 400);
        }
    }

    /**
     * Admin : valider une demande (paiement vérifié manuellement). Planifie le premier jour ouvré + fin.
     */
    public function validateSubscription(Request $request, int $id)
    {
        if ($r = $this->adminRequires($request, 'admin.subscriptions')) {
            return $r;
        }

        $subscription = Subscription::findOrFail($id);
        if (!$subscription->isPending()) {
            return response()->json(['message' => 'Cette demande n\'est plus en attente.'], 400);
        }

        Subscription::applyPaymentConfirmedScheduling($subscription, now());
        $this->appNotifications->notifyClientAfterAdminScheduling($subscription->fresh());

        return response()->json($subscription->fresh()->load(['user', 'subscriptionPlan']));
    }

    /**
     * Admin : rejeter une demande (paiement échoué ou autre).
     */
    public function rejectSubscription(Request $request, int $id)
    {
        if ($r = $this->adminRequires($request, 'admin.subscriptions')) {
            return $r;
        }

        $subscription = Subscription::findOrFail($id);
        if (!$subscription->isPending()) {
            return response()->json(['message' => 'Cette demande n\'est plus en attente.'], 400);
        }

        $reason = trim((string) $request->input('reason', ''));
        if ($reason === '') {
            $reason = 'Demande refusée par l\'administrateur.';
        }

        $subscription->update([
            'status' => Subscription::STATUS_REJECTED,
            'rejected_reason' => $reason,
        ]);

        $this->appNotifications->notifySubscription($subscription->fresh(), 'rejected', $reason);

        return response()->json($subscription->fresh()->load(['user', 'subscriptionPlan']));
    }

    /**
     * Admin : créer un abonnement actif pour un client (après vérification manuelle).
     */
    public function storeForUser(Request $request)
    {
        if ($r = $this->adminRequires($request, 'admin.subscriptions')) {
            return $r;
        }

        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'period' => 'required|in:week',
        ]);

        $plan = SubscriptionPlan::findOrFail($data['subscription_plan_id']);
        $period = 'week';
        $price = (float) $plan->price_week;

        $sub = Subscription::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $data['user_id'],
            'subscription_plan_id' => $plan->id,
            'plan' => $plan->name,
            'price' => $price,
            'period' => $period,
            'currency' => $plan->currency ?? 'CDF',
            'status' => Subscription::STATUS_PENDING,
            'started_at' => null,
            'expires_at' => null,
        ]);

        Subscription::applyPaymentConfirmedScheduling($sub->fresh(), now());
        $this->appNotifications->notifySubscription($sub->fresh(), 'admin_scheduled');

        return response()->json($sub->fresh()->load('subscriptionPlan'), 201);
    }

    /**
     * Admin : mettre un abonnement actif en pause.
     */
    public function pauseSubscription(Request $request, int $id)
    {
        if ($r = $this->adminRequires($request, 'admin.subscriptions')) {
            return $r;
        }
        $subscription = Subscription::findOrFail($id);
        if (!$subscription->isActive()) {
            return response()->json(['message' => 'Seul un abonnement actif peut être mis en pause.'], 400);
        }
        $subscription->update(['status' => Subscription::STATUS_PAUSED]);

        return response()->json($subscription->fresh()->load(['user', 'subscriptionPlan']));
    }

    /**
     * Admin : reprendre un abonnement en pause.
     */
    public function resumeSubscription(Request $request, int $id)
    {
        if ($r = $this->adminRequires($request, 'admin.subscriptions')) {
            return $r;
        }
        $subscription = Subscription::findOrFail($id);
        if (!$subscription->isPaused()) {
            return response()->json(['message' => 'Seul un abonnement en pause peut être repris.'], 400);
        }
        $subscription->update(['status' => Subscription::STATUS_ACTIVE]);

        return response()->json($subscription->fresh()->load(['user', 'subscriptionPlan']));
    }

    /**
     * Admin : annuler / supprimer un abonnement (soft: statut cancelled).
     */
    public function cancelSubscription(Request $request, int $id)
    {
        if ($r = $this->adminRequires($request, 'admin.subscriptions')) {
            return $r;
        }
        $subscription = Subscription::findOrFail($id);
        if (in_array($subscription->status, [Subscription::STATUS_CANCELLED, Subscription::STATUS_REJECTED], true)) {
            return response()->json(['message' => 'Cet abonnement est déjà annulé ou refusé.'], 400);
        }
        $subscription->update(['status' => Subscription::STATUS_CANCELLED]);

        return response()->json($subscription->fresh()->load(['user', 'subscriptionPlan']));
    }

    /**
     * Client : retirer une ligne de son historique (abonnements terminés, refusés ou expirés — pas les demandes en cours).
     */
    public function destroyMyHistoryEntry(Request $request, int $id)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $subscription = Subscription::where('user_id', $user->id)->whereKey($id)->firstOrFail();

        if (in_array($subscription->status, [Subscription::STATUS_PENDING, Subscription::STATUS_SCHEDULED, Subscription::STATUS_ACTIVE], true)) {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer un abonnement en attente, planifié ou actif depuis l’historique.',
            ], 400);
        }

        $subscription->delete();

        return response()->json(['message' => 'Cette entrée a été retirée de votre historique.'], 200);
    }

    /**
     * Client : effacer tout l’historique affichable (statuts terminaux uniquement).
     */
    public function clearMyHistory(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $terminal = [
            Subscription::STATUS_REJECTED,
            Subscription::STATUS_EXPIRED,
            Subscription::STATUS_CANCELLED,
            Subscription::STATUS_PAUSED,
        ];

        $deleted = Subscription::where('user_id', $user->id)
            ->whereIn('status', $terminal)
            ->delete();

        return response()->json([
            'message' => $deleted > 0
                ? 'Votre historique d’abonnements terminés a été effacé.'
                : 'Aucune entrée à effacer.',
            'deleted' => $deleted,
        ], 200);
    }

    private function subscriptionPaidMessage(Subscription $sub): string
    {
        if (! $sub->started_at) {
            return 'Paiement confirmé. Votre abonnement sera configuré sous peu.';
        }

        $dateStr = $sub->started_at->timezone(config('app.timezone'))->locale('fr')->translatedFormat('d F Y');

        return "Paiement confirmé. Votre abonnement sera actif à partir du {$dateStr}. Vous recevrez vos repas à partir de cette date.";
    }
}
