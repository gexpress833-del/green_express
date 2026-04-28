<?php

namespace App\Notifications;

use App\Models\Order;
use App\Support\NotificationDeepLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderCreatedNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $client = $this->order->user;
        return [
            'category' => 'order',
            'kind' => 'order_created',
            'order_id' => $this->order->id,
            'order_uuid' => $this->order->uuid,
            'deep_link' => NotificationDeepLink::forOrder($notifiable, $this->order->id),
            'status' => $this->order->status,
            'total_amount' => (float) $this->order->total_amount,
            'created_at' => optional($this->order->created_at)?->toIso8601String(),
            'title' => 'Nouvelle commande',
            'message' => 'Une nouvelle commande a été créée.',
            'origin_type' => 'client',
            'origin_user_id' => $client?->id,
            'origin_user_name' => $client?->name ?? 'Client',
        ];
    }
}

