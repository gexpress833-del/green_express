<?php

namespace App\Services;

use App\Events\OrderRealtimeEvent;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderCreatedNotification;
use App\Notifications\OrderStatusChangedNotification;
use App\Services\BeamsService;

class OrderNotificationService
{
    public function __construct(private BeamsService $beams)
    {
    }

    public function notifyOrderCreated(Order $order): void
    {
        // Admins uniquement — le client est notifié à la réception du code de livraison (statut payé + code GX-…)
        User::where('role', 'admin')->each(fn ($u) => $u->notify(new OrderCreatedNotification($order)));

        OrderRealtimeEvent::dispatch($order, 'created');

        $this->beams->sendToAdmins([
            'title' => 'Nouvelle commande',
            'body' => "Commande #{$order->id} reçue.",
            'deep_link' => '/admin/orders',
        ]);
    }

    /**
     * @param  \App\Models\User|null  $triggeredBy  Utilisateur à l'origine du changement (admin, livreur) ; null = système (webhook, job).
     */
    public function notifyStatusChanged(Order $order, string $from, string $to, ?User $triggeredBy = null): void
    {
        $notification = new OrderStatusChangedNotification($order, $from, $to, $triggeredBy);

        User::where('role', 'admin')->each(fn ($u) => $u->notify($notification));

        if ($order->user) {
            $order->user->notify($notification);
        }

        OrderRealtimeEvent::dispatch($order, 'status_changed', $from, $to);

        if ($to === 'paid' && $order->user) {
            $this->beams->sendToUser($order->user->id, [
                'title' => 'Paiement confirmé',
                'body' => 'Votre commande est confirmée. Code de livraison : '.$order->delivery_code,
                'deep_link' => '/client/orders',
            ]);
        }

        if ($to === 'delivered' && $order->user) {
            $this->beams->sendToUser($order->user->id, [
                'title' => 'Commande livrée',
                'body' => 'Votre commande a été livrée avec succès.',
                'deep_link' => '/client/orders',
            ]);
        }

        if ($to === 'cancelled' && $order->user) {
            $this->beams->sendToUser($order->user->id, [
                'title' => 'Commande annulée',
                'body' => 'Votre commande a été annulée.',
                'deep_link' => '/client/orders',
            ]);
        }

        // Selon statut : cuisiniers / livreurs
        if ($to === 'pending') {
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

