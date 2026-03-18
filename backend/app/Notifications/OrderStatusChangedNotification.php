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
        return [
            'kind' => 'order_status_changed',
            'order_id' => $this->order->id,
            'order_uuid' => $this->order->uuid,
            'from' => $this->from,
            'to' => $this->to,
            'total_amount' => (float) $this->order->total_amount,
            'title' => 'Statut de commande mis à jour',
            'message' => "Statut : {$this->from} → {$this->to}",
            'updated_at' => now()->toIso8601String(),
            'origin_type' => $originType,
            'origin_user_id' => $originUserId,
            'origin_user_name' => $originUserName,
        ];
    }
}

