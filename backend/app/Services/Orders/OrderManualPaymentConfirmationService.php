<?php

namespace App\Services\Orders;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\OrderNotificationService;
use Illuminate\Support\Str;

/**
 * Confirmation hors FlexPay (espèces, virement vérifié au siège, tests admin).
 */
final class OrderManualPaymentConfirmationService
{
    public function __construct(private OrderNotificationService $orderNotifications) {}

    public function confirm(Order $order, User $actor, ?string $provider = null, ?string $providerPaymentId = null, ?string $currency = null, ?array $rawResponse = null): void
    {
        if ($order->status !== 'pending_payment') {
            throw new \InvalidArgumentException('Cette commande a déjà été payée ou ne peut pas être confirmée ainsi.');
        }

        $deliveryCode = 'GX-'.strtoupper(Str::random(6));
        while (Order::where('delivery_code', $deliveryCode)->exists()) {
            $deliveryCode = 'GX-'.strtoupper(Str::random(6));
        }

        $raw = $rawResponse ?? [];
        if (! isset($raw['source'])) {
            $raw['source'] = 'manual_confirmation';
        }
        $raw['by_user_id'] = $actor->id;

        Payment::create([
            'order_id' => $order->id,
            'provider' => $provider ?? 'manual',
            'provider_payment_id' => $providerPaymentId,
            'amount' => $order->total_amount,
            'currency' => $currency ?? (string) ($order->currency ?: 'USD'),
            'status' => 'completed',
            'raw_response' => $raw,
        ]);

        $oldStatus = (string) $order->status;
        $order->update([
            'status' => 'paid',
            'delivery_code' => $deliveryCode,
        ]);

        $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid', $actor);
    }
}
