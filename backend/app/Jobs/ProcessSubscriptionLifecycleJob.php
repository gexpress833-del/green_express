<?php

namespace App\Jobs;

use App\Models\CompanySubscription;
use App\Models\Subscription;
use App\Services\NotificationOrchestratorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessSubscriptionLifecycleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;

    public function handle(NotificationOrchestratorService $notifications): void
    {
        Subscription::query()
            ->where('status', Subscription::STATUS_SCHEDULED)
            ->whereNotNull('started_at')
            ->where('started_at', '<=', now())
            ->orderBy('id')
            ->limit(200)
            ->get()
            ->each(function (Subscription $sub) use ($notifications) {
                $sub->update(['status' => Subscription::STATUS_ACTIVE]);
                $notifications->notifySubscription($sub->fresh(), 'activated');
            });

        Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->orderBy('id')
            ->limit(200)
            ->get()
            ->each(function (Subscription $sub) use ($notifications) {
                $sub->update(['status' => Subscription::STATUS_EXPIRED]);
                $notifications->notifySubscription($sub->fresh(), 'expired');
            });

        // Abonnements entreprise : passer en `expired` quand end_date dépasse maintenant.
        // Ne touche pas au payment_status (paid reste paid pour la facturation/historique).
        CompanySubscription::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '<=', now())
            ->orderBy('id')
            ->limit(200)
            ->get()
            ->each(function (CompanySubscription $sub) use ($notifications) {
                $sub->update(['status' => 'expired']);
                $notifications->notifyCompanySubscriptionExpired($sub->fresh());
            });
    }
}
