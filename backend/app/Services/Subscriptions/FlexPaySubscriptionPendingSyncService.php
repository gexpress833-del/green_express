<?php

namespace App\Services\Subscriptions;

use App\Models\CompanySubscription;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\FlexPayService;
use Illuminate\Support\Facades\Log;

/**
 * Interroge FlexPay (/check) pour paiements abonnement encore « pending ».
 * Même temporisation que {@see \App\Services\Orders\FlexPayPendingPaymentSyncService}.
 */
final class FlexPaySubscriptionPendingSyncService
{
    public function __construct(
        private FlexPayService $flexPay,
        private SubscriptionPaymentCompletionService $subscriptionCompletion,
        private CompanySubscriptionPaymentCompletionService $companySubscriptionCompletion,
    ) {}

    public function trySyncSubscriptionPayment(Subscription $subscription, bool $forClientPolling = false): bool
    {
        $payment = Payment::where('subscription_id', $subscription->id)->orderByDesc('id')->first();

        return $this->syncPendingPayment(
            $payment,
            $forClientPolling,
            onPaid: fn () => $this->subscriptionCompletion->completeAfterPayment($subscription),
            onFailed: null,
            logContext: ['subscription_id' => $subscription->id],
        );
    }

    public function trySyncCompanySubscriptionPayment(CompanySubscription $subscription, bool $forClientPolling = false): bool
    {
        $payment = Payment::where('company_subscription_id', $subscription->id)->orderByDesc('id')->first();

        return $this->syncPendingPayment(
            $payment,
            $forClientPolling,
            onPaid: fn () => $this->companySubscriptionCompletion->completeAfterPayment($subscription),
            onFailed: function () use ($subscription, $payment) {
                $reason = $payment?->fresh()?->failure_reason ?: 'Échec du paiement par carte';
                $this->companySubscriptionCompletion->markFailed($subscription, $reason);
            },
            logContext: ['company_subscription_id' => $subscription->id],
        );
    }

    /**
     * @param  callable(): void|null  $onFailed
     */
    private function syncPendingPayment(
        ?Payment $payment,
        bool $forClientPolling,
        callable $onPaid,
        ?callable $onFailed,
        array $logContext,
    ): bool {
        $minAgeSeconds = $forClientPolling ? 2 : 15;

        if (
            ! $payment
            || $payment->status !== 'pending'
            || ! $payment->provider_payment_id
            || ! $payment->updated_at
            || $payment->updated_at->gte(now()->subSeconds($minAgeSeconds))
        ) {
            return false;
        }

        try {
            $check = $this->flexPay->checkTransaction((string) $payment->provider_payment_id);
            if (! is_array($check)) {
                return false;
            }

            if ($check['paid'] ?? false) {
                $payment->update([
                    'status' => 'completed',
                    'failure_reason' => null,
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_check' => $check['raw'] ?? []]),
                ]);
                $onPaid();

                return true;
            }

            if ($check['failed'] ?? false) {
                $payment->update([
                    'status' => 'failed',
                    'failure_reason' => $payment->failure_reason ?: 'Échec du paiement',
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_check' => $check['raw'] ?? []]),
                ]);
                if ($onFailed) {
                    $onFailed();
                }

                return true;
            }

            $payment->touch();

            return false;
        } catch (\Throwable $e) {
            Log::warning('FlexPay active check failed for subscription payment', array_merge($logContext, [
                'msg' => $e->getMessage(),
            ]));

            return false;
        }
    }
}
