<?php

namespace App\Services;

use App\Models\Promotion;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\AnnouncementNotification;
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
}
