<?php

namespace App\Events;

use App\Models\Subscription;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionRealtimeEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $subscriptionId;
    public ?int $userId;
    public string $status;
    public string $event;
    public ?string $detail;

    public function __construct(Subscription $subscription, string $event, ?string $detail = null)
    {
        $this->subscriptionId = (int) $subscription->id;
        $this->userId = $subscription->user_id ? (int) $subscription->user_id : null;
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

        if ($this->userId) {
            $channels[] = new PrivateChannel('subscriptions.user.'.$this->userId);
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
            'user_id' => $this->userId,
            'status' => $this->status,
            'event' => $this->event,
            'detail' => $this->detail,
            'scope' => 'personal',
        ];
    }
}
