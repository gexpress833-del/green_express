<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\ShwaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    /**
     * Liste des abonnements (admin: tous avec user + plan, client: les siens).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Subscription::with(['user:id,name,email', 'subscriptionPlan'])->orderByDesc('created_at');

        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        $list = $query->get();

        if ($user->role === 'admin') {
            $list->each(function (Subscription $sub) {
                $sub->has_payment_received = Payment::where('subscription_id', $sub->id)
                    ->whereIn('status', ['completed', 'paid'])->exists();
            });
        } else {
            $list->each(function (Subscription $sub) {
                $sub->days_until_expiry = $sub->daysUntilExpiry();
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
            'period' => 'required|in:week,month',
        ]);

        $plan = SubscriptionPlan::findOrFail($data['subscription_plan_id']);
        if (!$plan->is_active) {
            return response()->json(['message' => 'Ce plan n\'est plus disponible.'], 400);
        }

        $userId = $request->user()->id;
        $hasOngoing = Subscription::where('user_id', $userId)
            ->whereIn('status', [Subscription::STATUS_PENDING, Subscription::STATUS_ACTIVE])
            ->exists();
        if ($hasOngoing) {
            return response()->json(['message' => 'Vous avez déjà un abonnement en cours (en attente ou actif). Vous ne pouvez pas souscrire à un autre tant qu\'il n\'est pas expiré ou traité.'], 400);
        }

        $period = $data['period'];
        $price = $period === 'week' ? (float) $plan->price_week : (float) $plan->price_month;

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
     * Client : initier un paiement Shwary pour un abonnement en attente.
     */
    public function initiatePayment(Request $request, int $id)
    {
        $subscription = Subscription::findOrFail($id);
        $user = $request->user();

        if ($subscription->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }
        if (!$subscription->isPending()) {
            return response()->json(['message' => 'Cet abonnement n\'est plus en attente de paiement.'], 400);
        }

        $data = $request->validate([
            'client_phone_number' => 'required|string',
            'country_code' => 'required|string|in:DRC,KE,UG',
        ]);

        try {
            $shwaryService = app(ShwaryService::class);
            if (!$shwaryService->isConfigured()) {
                return response()->json(['message' => 'Service de paiement non configuré.'], 500);
            }

            $subCurrency = $subscription->currency ?? 'CDF';
            $amountLocal = $shwaryService->convertToLocalAmount(
                (float) $subscription->price,
                $subCurrency,
                $data['country_code']
            );
            $phoneNormalized = $shwaryService->normalizePhoneNumber(
                $data['client_phone_number'],
                $data['country_code']
            );
            $callbackUrl = config('shwary.callback_url')
                ?: (rtrim(config('app.url'), '/') . '/api/shwary/callback');
            $metadata = [
                'subscription_id' => $subscription->id,
                'subscription_uuid' => $subscription->uuid,
                'user_id' => $subscription->user_id,
            ];

            $shwaryResponse = $shwaryService->initiatePayment(
                $amountLocal,
                $phoneNormalized,
                $data['country_code'],
                $callbackUrl,
                $metadata
            );

            $paymentStatus = $shwaryResponse['status'] ?? 'pending';
            if ($paymentStatus !== 'completed' && $paymentStatus !== 'failed') {
                $paymentStatus = 'pending';
            }
            $isSandbox = config('shwary.sandbox', true);
            $isLocal = app()->environment('local');
            if ($isSandbox || $isLocal) {
                $paymentStatus = 'completed';
            }

            $payment = Payment::create([
                'subscription_id' => $subscription->id,
                'order_id' => null,
                'provider' => 'shwary',
                'provider_payment_id' => $shwaryResponse['id'],
                'reference_id' => $shwaryResponse['referenceId'] ?? null,
                'amount' => $shwaryResponse['amount'] ?? $subscription->price,
                'currency' => $shwaryResponse['currency'] ?? $subCurrency,
                'phone' => $phoneNormalized ?? null,
                'status' => 'pending',
                'raw_response' => $shwaryResponse,
            ]);

            $countries = ShwaryService::getSupportedCountries();
            $currencyDebit = $shwaryResponse['currency'] ?? $countries[$data['country_code']]['currency'] ?? 'CDF';
            return response()->json([
                'subscription' => $subscription->fresh()->load('subscriptionPlan'),
                'payment' => $payment,
                'shwary_transaction' => $shwaryResponse,
                'amount_to_debit' => $amountLocal,
                'currency_to_debit' => $currencyDebit,
                'message' => $payment->status === 'completed'
                    ? 'Paiement reçu. Votre demande sera examinée par l\'équipe et l\'abonnement sera activé après validation.'
                    : 'Paiement initié. En attente de confirmation sur votre mobile.',
                'payment_completed' => $payment->status === 'completed',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Shwary subscription payment failed', [
                'subscription_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Erreur lors de l\'initiation du paiement.',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Admin : valider une demande (après vérification paiement). Passe en active et définit les dates.
     */
    public function validateSubscription(Request $request, int $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $subscription = Subscription::findOrFail($id);
        if (!$subscription->isPending()) {
            return response()->json(['message' => 'Cette demande n\'est plus en attente.'], 400);
        }

        $startedAt = now();
        $subscription->update([
            'status' => Subscription::STATUS_ACTIVE,
            'started_at' => $startedAt,
            'expires_at' => Subscription::computeExpiresAt($startedAt, $subscription->period),
            'rejected_reason' => null,
        ]);
        \App\Models\Invoice::createForSubscriptionIfMissing($subscription->fresh());

        return response()->json($subscription->fresh()->load(['user', 'subscriptionPlan']));
    }

    /**
     * Admin : rejeter une demande (paiement échoué ou autre).
     */
    public function rejectSubscription(Request $request, int $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $subscription = Subscription::findOrFail($id);
        if (!$subscription->isPending()) {
            return response()->json(['message' => 'Cette demande n\'est plus en attente.'], 400);
        }

        $reason = $request->input('reason', '');

        $subscription->update([
            'status' => Subscription::STATUS_REJECTED,
            'rejected_reason' => $reason,
        ]);

        return response()->json($subscription->fresh()->load(['user', 'subscriptionPlan']));
    }

    /**
     * Admin : créer un abonnement actif pour un client (après vérification manuelle).
     */
    public function storeForUser(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'period' => 'required|in:week,month',
        ]);

        $plan = SubscriptionPlan::findOrFail($data['subscription_plan_id']);
        $period = $data['period'];
        $price = $period === 'week' ? (float) $plan->price_week : (float) $plan->price_month;
        $startedAt = now();
        $expiresAt = Subscription::computeExpiresAt($startedAt, $period);

        $sub = Subscription::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $data['user_id'],
            'subscription_plan_id' => $plan->id,
            'plan' => $plan->name,
            'price' => $price,
            'period' => $period,
            'currency' => $plan->currency ?? 'CDF',
            'status' => Subscription::STATUS_ACTIVE,
            'started_at' => $startedAt,
            'expires_at' => $expiresAt,
        ]);

        return response()->json($sub->load('subscriptionPlan'), 201);
    }

    /**
     * Admin : mettre un abonnement actif en pause.
     */
    public function pauseSubscription(Request $request, int $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
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
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
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
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }
        $subscription = Subscription::findOrFail($id);
        if (in_array($subscription->status, [Subscription::STATUS_CANCELLED, Subscription::STATUS_REJECTED], true)) {
            return response()->json(['message' => 'Cet abonnement est déjà annulé ou refusé.'], 400);
        }
        $subscription->update(['status' => Subscription::STATUS_CANCELLED]);
        return response()->json($subscription->fresh()->load(['user', 'subscriptionPlan']));
    }
}
