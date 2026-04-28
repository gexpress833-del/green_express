<?php

namespace App\Support;

class NotificationDeepLink
{
    private static function roleFromNotifiable(object $notifiable): string
    {
        $role = '';
        if (property_exists($notifiable, 'role')) {
            $role = (string) ($notifiable->role ?? '');
        }

        return strtolower(trim($role));
    }

    public static function forOrder(object $notifiable, int|string|null $orderId): string
    {
        $id = trim((string) $orderId);
        if ($id === '') {
            return '/notifications';
        }

        $enc = rawurlencode($id);
        return match (self::roleFromNotifiable($notifiable)) {
            'admin' => "/admin/orders?order={$enc}",
            'client' => "/client/orders?order={$enc}",
            'livreur' => "/livreur/order/{$enc}",
            'cuisinier' => "/cuisinier/orders?order={$enc}",
            'entreprise' => "/entreprise/orders?order={$enc}",
            'verificateur' => '/verificateur',
            default => "/client/orders?order={$enc}",
        };
    }

    public static function forEventRequest(object $notifiable): string
    {
        return match (self::roleFromNotifiable($notifiable)) {
            'admin' => '/admin/event-requests',
            'secretaire' => '/secretaire/event-requests',
            'client' => '/client/event-requests',
            'livreur', 'cuisinier', 'entreprise', 'verificateur' => '/notifications',
            default => '/client',
        };
    }

    public static function forSubscription(object $notifiable): string
    {
        return match (self::roleFromNotifiable($notifiable)) {
            'admin' => '/admin/subscriptions',
            'entreprise' => '/entreprise/subscriptions',
            'client' => '/client/subscriptions',
            'livreur', 'cuisinier', 'verificateur', 'secretaire' => '/notifications',
            default => '/client/subscriptions',
        };
    }

    public static function forCompanySubscription(object $notifiable, int|string|null $subscriptionId = null): string
    {
        $role = self::roleFromNotifiable($notifiable);
        $id = trim((string) $subscriptionId);
        $enc = rawurlencode($id);

        if ($role === 'admin') {
            return $id === '' ? '/admin/company-subscriptions' : "/admin/company-subscriptions?subscription={$enc}";
        }

        if ($role === 'entreprise') {
            return $id === '' ? '/entreprise/subscriptions' : "/entreprise/subscriptions?subscription={$enc}";
        }

        return '/notifications';
    }

    public static function forPromotion(object $notifiable, int|string|null $promotionId): string
    {
        $role = self::roleFromNotifiable($notifiable);
        $id = trim((string) $promotionId);
        $enc = rawurlencode($id);

        if ($role === 'admin') {
            return $id === '' ? '/admin/promotions' : "/admin/promotions/{$enc}/edit";
        }
        if ($role === 'client') {
            return $id === '' ? '/client/promotions' : "/client/promotions?promo={$enc}";
        }

        return '/notifications';
    }

    public static function forAnnouncement(): string
    {
        return '/notifications';
    }

    public static function forOperational(object $notifiable): string
    {
        return match (self::roleFromNotifiable($notifiable)) {
            'admin' => '/admin',
            'cuisinier' => '/cuisinier',
            'livreur' => '/livreur',
            'entreprise' => '/entreprise',
            'client' => '/client',
            'verificateur' => '/verificateur',
            'secretaire' => '/secretaire',
            default => '/notifications',
        };
    }
}
