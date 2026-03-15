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
        // Admins
        User::where('role', 'admin')->each(fn ($u) => $u->notify(new OrderCreatedNotification($order)));

        // Client (propriétaire)
        if ($order->user) {
            $order->user->notify(new OrderCreatedNotification($order));
        }
    }

    public function notifyStatusChanged(Order $order, string $from, string $to): void
    {
        $notification = new OrderStatusChangedNotification($order, $from, $to);

        // Toujours : admin + client
        User::where('role', 'admin')->each(fn ($u) => $u->notify($notification));
        if ($order->user) {
            $order->user->notify($notification);
        }

        // Selon statut : cuisiniers / livreurs / vérificateurs
        if ($to === 'pending') {
            // Commande payée, à préparer / livrer
            $this->notifyCuisiniersForOrder($order, $notification);
            User::where('role', 'livreur')->each(fn ($u) => $u->notify($notification));
        }

        if ($to === 'delivered') {
            // À vérifier / clôturer
            User::where('role', 'verificateur')->each(fn ($u) => $u->notify($notification));
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

