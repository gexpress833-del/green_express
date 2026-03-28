<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderCreatedNotification;
use App\Notifications\OrderStatusChangedNotification;

class OrderNotificationService
{
    public function notifyOrderCreated(Order $order): void
    {
        // Admins uniquement — le client est notifié à la réception du code de livraison (statut payé + code GX-…)
        User::where('role', 'admin')->each(fn ($u) => $u->notify(new OrderCreatedNotification($order)));
    }

    /**
     * @param  \App\Models\User|null  $triggeredBy  Utilisateur à l'origine du changement (admin, livreur) ; null = système (webhook, job).
     */
    public function notifyStatusChanged(Order $order, string $from, string $to, ?User $triggeredBy = null): void
    {
        $notification = new OrderStatusChangedNotification($order, $from, $to, $triggeredBy);

        User::where('role', 'admin')->each(fn ($u) => $u->notify($notification));

        // Client : code de livraison (paid + GX-…) ou confirmation de livraison terminée (delivered)
        if ($order->user) {
            if ($to === 'paid' && $order->delivery_code) {
                $order->user->notify($notification);
            } elseif ($to === 'delivered') {
                $order->user->notify($notification);
            }
        }

        // Selon statut : cuisiniers / livreurs (le vérificateur ne valide que les codes promotion de réclamation, pas les livraisons)
        if ($to === 'pending') {
            // Commande payée, à préparer / livrer
            $this->notifyCuisiniersForOrder($order, $notification);
            User::where('role', 'livreur')->each(fn ($u) => $u->notify($notification));
        }
    }

    private function notifyCuisiniersForOrder(Order $order, $notification): void
    {
        $order->loadMissing('items.menu');

        $creatorIds = $order->items
            ->map(fn ($item) => $item->menu?->created_by)
            ->filter()
            ->unique()
            ->values();

        if ($creatorIds->isEmpty()) {
            // Fallback : notifier tous les cuisiniers (si la relation menu/creator est absente)
            User::where('role', 'cuisinier')->each(fn ($u) => $u->notify($notification));
            return;
        }

        User::whereIn('id', $creatorIds)->each(fn ($u) => $u->notify($notification));
    }
}

