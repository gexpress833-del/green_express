<?php

namespace App\Events;

use App\Models\CompanySubscription;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompanySubscriptionRealtimeEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $subscriptionId;
    public ?int $companyId;
    public string $status;
    public string $event;
    public ?string $detail;

    public function __construct(CompanySubscription $subscription, string $event, ?string $detail = null)
    {
        $this->subscriptionId = (int) $subscription->id;
        $this->companyId = $subscription->company_id ? (int) $subscription->company_id : null;
        $this->status = (string) $subscription->status;
        $this->event = $event;
        $this->detail = $detail;
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('subscriptions.admin')];

        if ($this->companyId) {
            $channels[] = new PrivateChannel('subscriptions.company.'.$this->companyId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'subscription.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'subscription_id' => $this->subscriptionId,
            'company_id' => $this->companyId,
            'status' => $this->status,
            'event' => $this->event,
            'detail' => $this->detail,
            'scope' => 'b2b',
        ];
    }
}
