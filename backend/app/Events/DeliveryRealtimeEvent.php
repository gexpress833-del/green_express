<?php

namespace App\Events;

use App\Models\DeliveryLog;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryRealtimeEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $deliveryId;
    public ?int $companyId;
    public ?int $mealPlanId;
    public string $status;
    public string $action;

    public function __construct(DeliveryLog $delivery, string $action)
    {
        $this->deliveryId = (int) $delivery->id;
        $this->companyId = $delivery->company_id ? (int) $delivery->company_id : null;
        $this->mealPlanId = $delivery->meal_plan_id ? (int) $delivery->meal_plan_id : null;
        $this->status = (string) $delivery->status;
        $this->action = $action;
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('deliveries.admin')];

        if ($this->companyId) {
            $channels[] = new PrivateChannel('deliveries.company.'.$this->companyId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'delivery.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'delivery_id' => $this->deliveryId,
            'company_id' => $this->companyId,
            'meal_plan_id' => $this->mealPlanId,
            'status' => $this->status,
            'action' => $this->action,
        ];
    }
}
