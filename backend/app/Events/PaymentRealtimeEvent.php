<?php

namespace App\Events;

use App\Models\Payment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentRealtimeEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $paymentId;
    public ?int $userId;
    public ?int $orderId;
    public ?int $subscriptionId;
    public ?int $companySubscriptionId;
    public string $provider;
    public string $status;
    public string $event;
    public ?string $failureReason;
    public string $clientMessage;
    public string $targetKind;
    public ?float $amount;
    public ?string $currency;

    public function __construct(Payment $payment, string $event, string $clientMessage)
    {
        $this->paymentId = (int) $payment->id;
        $this->userId = self::resolveOwnerUserId($payment);
        $this->orderId = $payment->order_id ? (int) $payment->order_id : null;
        $this->subscriptionId = $payment->subscription_id ? (int) $payment->subscription_id : null;
        $this->companySubscriptionId = $payment->company_subscription_id ? (int) $payment->company_subscription_id : null;
        $this->provider = (string) ($payment->provider ?? 'unknown');
        $this->status = (string) $payment->status;
        $this->event = $event;
        $this->failureReason = $payment->failure_reason;
        $this->clientMessage = $clientMessage;
        $this->targetKind = self::resolveTargetKind($payment);
        $this->amount = $payment->amount !== null ? (float) $payment->amount : null;
        $this->currency = $payment->currency;
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('payments.admin')];

        if ($this->userId) {
            $channels[] = new PrivateChannel('payments.user.'.$this->userId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'payment.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'payment_id' => $this->paymentId,
            'user_id' => $this->userId,
            'order_id' => $this->orderId,
            'subscription_id' => $this->subscriptionId,
            'company_subscription_id' => $this->companySubscriptionId,
            'provider' => $this->provider,
            'status' => $this->status,
            'event' => $this->event,
            'failure_reason' => $this->failureReason,
            'client_message' => $this->clientMessage,
            'target_kind' => $this->targetKind,
            'amount' => $this->amount,
            'currency' => $this->currency,
        ];
    }

    private static function resolveOwnerUserId(Payment $payment): ?int
    {
        $payment->loadMissing(['order:id,user_id', 'subscription:id,user_id', 'companySubscription:id,company_id', 'companySubscription.company:id,contact_user_id']);

        if ($payment->order && $payment->order->user_id) {
            return (int) $payment->order->user_id;
        }

        if ($payment->subscription && $payment->subscription->user_id) {
            return (int) $payment->subscription->user_id;
        }

        $companySubscription = $payment->companySubscription;
        if ($companySubscription && $companySubscription->company && $companySubscription->company->contact_user_id) {
            return (int) $companySubscription->company->contact_user_id;
        }

        return null;
    }

    private static function resolveTargetKind(Payment $payment): string
    {
        if ($payment->order_id) {
            return 'order';
        }
        if ($payment->subscription_id) {
            return 'subscription';
        }
        if ($payment->company_subscription_id) {
            return 'company_subscription';
        }

        return 'unknown';
    }
}
