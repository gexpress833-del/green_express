<?php

namespace App\Services\Subscriptions;

use App\Models\CompanySubscription;
use App\Services\NotificationOrchestratorService;
use App\Support\ClientPaymentMessage;

/**
 * Marque un abonnement entreprise comme payé après confirmation FlexPay (carte).
 */
final class CompanySubscriptionPaymentCompletionService
{
    public function __construct(private NotificationOrchestratorService $notifications) {}

    public function completeAfterPayment(CompanySubscription $subscription): bool
    {
        $subscription->refresh();

        if ((string) ($subscription->payment_status ?? '') === 'paid') {
            return true;
        }

        if ($subscription->status !== 'pending') {
            return false;
        }

        $subscription->update(['payment_status' => 'paid']);
        $this->notifications->notifyCompanySubscriptionPaymentConfirmed($subscription->fresh());

        return true;
    }

    public function markFailed(CompanySubscription $subscription, ?string $reason = null): void
    {
        $subscription->refresh();

        if ((string) ($subscription->payment_status ?? '') === 'paid') {
            return;
        }

        if ($subscription->status !== 'pending') {
            return;
        }

        $subscription->update(['payment_status' => 'failed']);
        $message = ClientPaymentMessage::sanitize((string) $reason) ?: 'Échec du paiement par carte';
        $this->notifications->notifyCompanySubscriptionPaymentFailed($subscription->fresh(), $message);
    }
}
