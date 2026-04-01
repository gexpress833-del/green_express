<?php

namespace App\Jobs;

use App\Models\Subscription;
use App\Services\AppNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessSubscriptionLifecycleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;

    public function handle(AppNotificationService $appNotifications): void
    {
        Subscription::query()
            ->where('status', Subscription::STATUS_SCHEDULED)
            ->whereNotNull('started_at')
            ->where('started_at', '<=', now())
            ->orderBy('id')
            ->limit(200)
            ->get()
            ->each(function (Subscription $sub) use ($appNotifications) {
                $sub->update(['status' => Subscription::STATUS_ACTIVE]);
                $appNotifications->notifySubscription($sub->fresh(), 'activated');
            });

        Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->orderBy('id')
            ->limit(200)
            ->get()
            ->each(function (Subscription $sub) use ($appNotifications) {
                $sub->update(['status' => Subscription::STATUS_EXPIRED]);
                $appNotifications->notifySubscription($sub->fresh(), 'expired');
            });
    }
}
