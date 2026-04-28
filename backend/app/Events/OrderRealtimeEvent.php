<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderRealtimeEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $orderId;
    public ?int $userId;
    public ?int $livreurId;
    public ?int $companyId;
    public ?string $uuid;
    public string $status;
    public ?string $deliveryCode;
    public string $action;
    public ?string $from;
    public ?string $to;

    public function __construct(Order $order, string $action, ?string $from = null, ?string $to = null)
    {
        $this->orderId = (int) $order->id;
        $this->userId = $order->user_id ? (int) $order->user_id : null;
        $this->livreurId = $order->livreur_id ? (int) $order->livreur_id : null;
        $this->companyId = $order->company_id ? (int) $order->company_id : null;
        $this->uuid = $order->uuid;
        $this->status = (string) $order->status;
        $this->deliveryCode = $order->delivery_code;
        $this->action = $action;
        $this->from = $from;
        $this->to = $to;
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('orders.admin')];

        if ($this->userId) {
            $channels[] = new PrivateChannel('orders.user.'.$this->userId);
        }

        if ($this->livreurId) {
            $channels[] = new PrivateChannel('orders.livreur.'.$this->livreurId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->orderId,
            'order_uuid' => $this->uuid,
            'user_id' => $this->userId,
            'livreur_id' => $this->livreurId,
            'company_id' => $this->companyId,
            'status' => $this->status,
            'delivery_code' => $this->deliveryCode,
            'action' => $this->action,
            'from' => $this->from,
            'to' => $this->to,
        ];
    }
}
