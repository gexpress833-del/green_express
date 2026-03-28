<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderStatusChangedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $from,
        public string $to,
        public ?User $triggeredBy = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $originType = 'system';
        $originUserId = null;
        $originUserName = null;
        if ($this->triggeredBy) {
            $originType = $this->triggeredBy->role ?? 'admin';
            $originUserId = $this->triggeredBy->id;
            $originUserName = $this->triggeredBy->name;
        }

        $order = $this->order;
        $isClient = $notifiable instanceof User && (int) $notifiable->id === (int) $order->user_id;

        if ($this->to === 'paid' && $order->delivery_code) {
            $code = $order->delivery_code;
            if ($isClient) {
                $title = 'Votre code de confirmation de livraison';
                $message = "Communiquez ce code au livreur lors de la réception : {$code}.";
            } else {
                $title = 'Commande payée — code livraison généré';
                $message = "Commande #{$order->id} : code client {$code}.";
            }
        } elseif ($this->to === 'delivered' && $isClient) {
            $title = 'Commande livrée';
            $message = "Votre commande n°{$order->id} a bien été livrée. Merci d’avoir choisi Green Express !";
        } else {
            $title = 'Statut de commande mis à jour';
            $message = "Statut : {$this->from} → {$this->to}";
        }

        return [
            'category' => 'order',
            'kind' => 'order_status_changed',
            'order_id' => $order->id,
            'order_uuid' => $order->uuid,
            'delivery_code' => $order->delivery_code,
            'from' => $this->from,
            'to' => $this->to,
            'total_amount' => (float) $order->total_amount,
            'title' => $title,
            'message' => $message,
            'updated_at' => now()->toIso8601String(),
            'origin_type' => $originType,
            'origin_user_id' => $originUserId,
            'origin_user_name' => $originUserName,
        ];
    }
}

