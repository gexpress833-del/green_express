<?php

namespace App\Services\Orders;

use App\Models\Order;
use App\Services\OrderNotificationService;
use Illuminate\Support\Str;

/**
 * Passe une commande en « payée » et génère le code de livraison après confirmation du paiement.
 */
final class OrderPaymentCompletionService
{
    public function __construct(private OrderNotificationService $orderNotifications) {}

    /**
     * @return bool true si la commande est (ou était déjà) payée avec code de livraison
     */
    public function completeOrderAfterPayment(Order $order): bool
    {
        $order->refresh();

        if ($order->delivery_code && in_array((string) $order->status, ['paid', 'pending', 'out_for_delivery', 'delivered'], true)) {
            return true;
        }

        if ($order->status !== 'pending_payment') {
            return (bool) $order->delivery_code;
        }

        $deliveryCode = $order->delivery_code;
        if (! $deliveryCode) {
            $deliveryCode = 'GX-'.strtoupper(Str::random(6));
            while (Order::where('delivery_code', $deliveryCode)->exists()) {
                $deliveryCode = 'GX-'.strtoupper(Str::random(6));
            }
        }

        $oldStatus = (string) $order->status;
        $order->update([
            'status' => 'paid',
            'delivery_code' => $deliveryCode,
        ]);
        $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid');

        return true;
    }
}
