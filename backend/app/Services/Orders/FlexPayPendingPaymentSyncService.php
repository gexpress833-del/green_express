<?php

namespace App\Services\Orders;

use App\Models\Order;
use App\Models\Payment;
use App\Services\FlexPayService;
use App\Services\OrderNotificationService;
use Illuminate\Support\Facades\Log;

/**
 * Interroge l’API FlexPay (/check) pour un paiement Mobile Money encore « pending ».
 * Même règle de temporisation que {@see \App\Http\Controllers\OrderController::paymentStatus}.
 */
final class FlexPayPendingPaymentSyncService
{
    public function __construct(
        private FlexPayService $flexPay,
        private OrderNotificationService $orderNotifications,
    ) {}

    public function trySyncOrderPayment(Order $order, bool $forClientPolling = false): bool
    {
        $payment = Payment::where('order_id', $order->id)->orderByDesc('id')->first();

        $minAgeSeconds = $forClientPolling ? 2 : 15;

        if (
            ! $payment
            || $payment->status !== 'pending'
            || ! $payment->provider_payment_id
            || ! $payment->updated_at
            || $payment->updated_at->gte(now()->subSeconds($minAgeSeconds))
        ) {
            return false;
        }

        try {
            $check = $this->flexPay->checkTransaction((string) $payment->provider_payment_id);
            if (! is_array($check)) {
                return false;
            }

            if ($check['paid'] ?? false) {
                $payment->update([
                    'status' => 'completed',
                    'failure_reason' => null,
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_check' => $check['raw'] ?? []]),
                ]);
                app(OrderPaymentCompletionService::class)->completeOrderAfterPayment($order);

                return true;
            }

            if ($check['failed'] ?? false) {
                $payment->update([
                    'status' => 'failed',
                    'failure_reason' => $payment->failure_reason ?: 'Échec du paiement Mobile Money',
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_check' => $check['raw'] ?? []]),
                ]);

                return true;
            }

            $payment->touch();

            return false;
        } catch (\Throwable $e) {
            Log::warning('FlexPay active check failed', ['order_id' => $order->id, 'msg' => $e->getMessage()]);

            return false;
        }
    }
}
