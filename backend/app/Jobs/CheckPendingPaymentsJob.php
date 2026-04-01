<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\AppNotificationService;
use App\Services\OrderNotificationService;
use App\Services\ShwaryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class CheckPendingPaymentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;
    public $timeout = 120;

    public function handle(ShwaryService $shwaryService, OrderNotificationService $orderNotifications, AppNotificationService $appNotifications): void
    {
        $maxRetries = 5;
        $maxAge = now()->subMinutes(10);

        $payments = Payment::query()
            ->where('status', 'pending')
            ->where('provider', 'shwary')
            ->whereNotNull('provider_payment_id')
            ->where('retry_count', '<', $maxRetries)
            ->where('created_at', '>', $maxAge)
            ->orderBy('created_at')
            ->limit(50)
            ->get();

        foreach ($payments as $payment) {
            $payment->update([
                'last_checked_at' => now(),
                'retry_count' => $payment->retry_count + 1,
            ]);

            $this->pollShwary($payment, $shwaryService, $orderNotifications, $appNotifications);
        }
    }

    private function pollShwary(
        Payment $payment,
        ShwaryService $shwaryService,
        OrderNotificationService $orderNotifications,
        AppNotificationService $appNotifications
    ): void
    {
        $data = $shwaryService->getTransactionStatus($payment->provider_payment_id);
        if ($data === null) {
            return;
        }

        $status = strtolower((string) ($data['status'] ?? ''));

            if ($status === 'completed') {
                $payment->update([
                    'status' => 'completed',
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_poll' => $data]),
                ]);
                if ($payment->order && $payment->order->status === 'pending_payment') {
                    $order = $payment->order;
                    $oldStatus = (string) $order->status;
                    $deliveryCode = 'GX-' . strtoupper(Str::random(6));
                    while (Order::where('delivery_code', $deliveryCode)->exists()) {
                        $deliveryCode = 'GX-' . strtoupper(Str::random(6));
                    }
                    $order->update([
                        'status' => 'paid',
                        'delivery_code' => $deliveryCode,
                    ]);
                    $orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid');
                }
                if ($payment->subscription_id) {
                    $sub = Subscription::find($payment->subscription_id);
                    if ($sub && $sub->isPending()) {
                        Subscription::applyPaymentConfirmedScheduling($sub, now());
                        $appNotifications->notifyClientAndAdminsAfterSubscriptionPayment($sub->fresh());
                    }
                }
            } elseif ($status === 'failed') {
            $payment->update([
                'status' => 'failed',
                'failure_reason' => $data['failureReason'] ?? null,
                'raw_response' => array_merge($payment->raw_response ?? [], ['last_poll' => $data]),
            ]);
            if ($payment->order) {
                $payment->order->update(['status' => 'cancelled']);
            }
        }
    }
}
