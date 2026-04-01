<?php

namespace App\Jobs;

use App\Models\Subscription;
use App\Services\AppNotificationService;
use App\Services\SubscriptionOperationalService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class SubscriptionDailyRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;

    public function handle(
        AppNotificationService $appNotifications,
        SubscriptionOperationalService $operational
    ): void {
        $tomorrow = Carbon::tomorrow()->toDateString();

        Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->whereNotNull('expires_at')
            ->orderBy('id')
            ->chunk(100, function ($subs) use ($appNotifications) {
                foreach ($subs as $sub) {
                    if ($sub->daysUntilExpiry() !== 1) {
                        continue;
                    }
                    $key = 'sub_expires_tmr_reminder:'.$sub->id.':'.now()->toDateString();
                    if (Cache::add($key, 1, now()->endOfDay())) {
                        $appNotifications->notifySubscription($sub->fresh(), 'expires_tomorrow');
                    }
                }
            });

        $summary = $operational->buildTomorrowPrepSummary();
        $detail = $summary['is_weekend']
            ? 'Demain est un week-end : pas de tournée ouvrée prévue.'
            : sprintf(
                'Prévu : %d repas pour %d client(s). Indication menu : %s.',
                $summary['estimated_meals'],
                $summary['client_count'],
                $summary['menu_summary']
            );

        $digestKey = 'operational_digest:'.now()->toDateString();
        if (Cache::add($digestKey, 1, now()->endOfDay())) {
            $appNotifications->notifyAdminsOperational(
                'Repas à livrer demain',
                'Liste disponible dans l’exploitation. '.$detail
            );
            $appNotifications->notifyCuisiniersOperational(
                'Préparation des plats pour demain',
                $summary['is_weekend']
                    ? 'Jour non ouvré — pas de préparation standard.'
                    : sprintf(
                        '%d client(s) à servir demain. %s',
                        $summary['client_count'],
                        $detail
                    )
            );
        }

        $startingCount = Subscription::query()
            ->where('status', Subscription::STATUS_SCHEDULED)
            ->whereDate('started_at', $tomorrow)
            ->count();

        if ($startingCount > 0) {
            $startKey = 'operational_starts_tomorrow:'.now()->toDateString();
            if (Cache::add($startKey, 1, now()->endOfDay())) {
                $appNotifications->notifyAdminsOperational(
                    'Un abonnement démarre demain',
                    sprintf('%d abonnement(s) passent en actif demain (premier jour ouvré).', $startingCount)
                );
            }
        }
    }
}
