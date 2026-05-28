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

        // L'admin valide manuellement : l'abonnement reste pending jusqu'à validation admin.
        if (! $subscription->isPending()) {
            return false;
        }

        $this->notifications->notifyClientAndAdminsAfterSubscriptionPayment($subscription->fresh());

        return true;
    }
}
