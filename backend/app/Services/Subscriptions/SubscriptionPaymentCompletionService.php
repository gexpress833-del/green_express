<?php

namespace App\Services\Subscriptions;

use App\Models\Subscription;
use App\Services\NotificationOrchestratorService;

/**
 * Planifie l'abonnement particulier après confirmation du paiement FlexPay.
 */
final class SubscriptionPaymentCompletionService
{
    public function __construct(private NotificationOrchestratorService $notifications) {}

    public function completeAfterPayment(Subscription $subscription): bool
    {
        $subscription->refresh();

        if (in_array((string) $subscription->status, [Subscription::STATUS_SCHEDULED, Subscription::STATUS_ACTIVE], true)) {
            return true;
        }

        if (! $subscription->isPending()) {
            return false;
        }

        Subscription::applyPaymentConfirmedScheduling($subscription, now());
        $this->notifications->notifyClientAndAdminsAfterSubscriptionPayment($subscription->fresh());

        return true;
    }
}
