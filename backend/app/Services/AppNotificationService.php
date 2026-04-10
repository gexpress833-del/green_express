<?php

namespace App\Services;

use App\Models\Promotion;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\AnnouncementNotification;
use App\Notifications\OperationalRoleNotification;
use App\Notifications\PromotionPublishedNotification;
use App\Notifications\SubscriptionLifecycleNotification;

class AppNotificationService
{
    public function notifySubscription(Subscription $subscription, string $event, ?string $detail = null): void
    {
        $subscription->loadMissing('user');
        if (! $subscription->user) {
            return;
        }
        $subscription->user->notify(new SubscriptionLifecycleNotification($subscription, $event, $detail));
    }

    /**
     * Notifie tous les utilisateurs qu’une promotion vient d’être publiée.
     */
    public function notifyPromotionPublished(Promotion $promotion, bool $featured = false): void
    {
        User::query()->orderBy('id')->chunk(100, function ($users) use ($promotion, $featured) {
            foreach ($users as $user) {
                $user->notify(new PromotionPublishedNotification($promotion, $featured));
            }
        });
    }

    /**
     * Diffuse une annonce à tous les utilisateurs (clients, équipes, etc.).
     *
     * @return int nombre d’utilisateurs notifiés
     */
    public function broadcastAnnouncement(string $title, string $message, ?User $sentBy = null): int
    {
        $count = 0;
        User::query()->orderBy('id')->chunk(100, function ($users) use ($title, $message, $sentBy, &$count) {
            foreach ($users as $user) {
                $user->notify(new AnnouncementNotification($title, $message, $sentBy));
                $count++;
            }
        });

        return $count;
    }

    public function notifyAdminsOperational(string $title, string $message): void
    {
        User::query()->where('role', 'admin')->orderBy('id')->chunk(50, function ($users) use ($title, $message) {
            foreach ($users as $user) {
                $user->notify(new OperationalRoleNotification($title, $message));
            }
        });
    }

    public function notifyCuisiniersOperational(string $title, string $message): void
    {
        User::query()->where('role', 'cuisinier')->orderBy('id')->chunk(50, function ($users) use ($title, $message) {
            foreach ($users as $user) {
                $user->notify(new OperationalRoleNotification($title, $message));
            }
        });
    }

    /**
     * Après paiement d’un abonnement particulier — informe les admins.
     */
    public function notifyAdminsNewPaidSubscription(Subscription $subscription): void
    {
        $subscription->loadMissing('user');
        $name = $subscription->user?->name ?? $subscription->user?->email ?? 'Client';
        $plan = $subscription->plan ?? 'Abonnement';
        $this->notifyAdminsOperational(
            'Nouvel abonnement payé',
            "Nouvel abonnement payé par {$name} — plan « {$plan} »."
        );
    }

    /** Après confirmation du paiement (FlexPay / webhook). */
    public function notifyClientAndAdminsAfterSubscriptionPayment(Subscription $subscription): void
    {
        $fresh = $subscription->fresh();
        if (! $fresh) {
            return;
        }
        if ($fresh->isScheduled() && (int) ($fresh->daysUntilStart() ?? -1) === 1) {
            $this->notifySubscription($fresh, 'starts_tomorrow');
        } else {
            $this->notifySubscription($fresh, 'scheduled');
        }
        $this->notifyAdminsNewPaidSubscription($fresh);
    }

    /** Après validation admin manuelle (sans notifier « payé » aux admins). */
    public function notifyClientAfterAdminScheduling(Subscription $subscription): void
    {
        $fresh = $subscription->fresh();
        if (! $fresh) {
            return;
        }
        if ($fresh->isScheduled() && (int) ($fresh->daysUntilStart() ?? -1) === 1) {
            $this->notifySubscription($fresh, 'starts_tomorrow');
        } else {
            $this->notifySubscription($fresh, 'scheduled');
        }
    }
}
