<?php

namespace App\Jobs;

use App\Events\PaymentRealtimeEvent;
use App\Models\CompanySubscription;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\FlexPayService;
use App\Services\NotificationOrchestratorService;
use App\Services\OrderNotificationService;
use App\Support\PaymentMessageBuilder;
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

    public function handle(FlexPayService $flexPayService, OrderNotificationService $orderNotifications, NotificationOrchestratorService $notifications): void
    {
        $maxRetries = 5;
        $maxAge = now()->subMinutes(10);

        $payments = Payment::query()
            ->where('status', 'pending')
            ->where('provider', 'flexpay')
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

            $this->pollFlexPay($payment, $flexPayService, $orderNotifications, $notifications);
        }
    }

    private function pollFlexPay(
        Payment $payment,
        FlexPayService $flexPayService,
        OrderNotificationService $orderNotifications,
        NotificationOrchestratorService $notifications
    ): void {
        if (config('flexpay.mock')) {
            return;
        }

        $data = $flexPayService->checkTransaction($payment->provider_payment_id);
        if ($data === null) {
            return;
        }

        if (! empty($data['paid'])) {
            $payment->update([
                'status' => 'completed',
                'failure_reason' => null,
                'raw_response' => array_merge($payment->raw_response ?? [], ['last_poll' => $data['raw'] ?? $data]),
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
                    $notifications->notifyClientAndAdminsAfterSubscriptionPayment($sub->fresh());
                }
            }
            if ($payment->company_subscription_id) {
                $companySub = CompanySubscription::find($payment->company_subscription_id);
                if ($companySub && $companySub->status === 'pending' && $companySub->payment_status !== 'paid') {
                    $companySub->update(['payment_status' => 'paid']);
                    $notifications->notifyCompanySubscriptionPaymentConfirmed($companySub->fresh());
                }
            }
        } elseif (! empty($data['failed'])) {
            $payment->update([
                'status' => 'failed',
                'failure_reason' => 'Échec (polling FlexPay)',
                'raw_response' => array_merge($payment->raw_response ?? [], ['last_poll' => $data['raw'] ?? $data]),
            ]);
            if ($payment->company_subscription_id) {
                $companySub = CompanySubscription::find($payment->company_subscription_id);
                if ($companySub && $companySub->status === 'pending' && $companySub->payment_status !== 'paid') {
                    $companySub->update(['payment_status' => 'failed']);
                    $notifications->notifyCompanySubscriptionPaymentFailed($companySub->fresh(), 'Échec (polling FlexPay)');
                }
            }
        } else {
            return;
        }

        $fresh = $payment->fresh();
        if (! $fresh) {
            return;
        }

        $parsed = [
            'success' => ! empty($data['paid']),
            'failure' => ! empty($data['failed']),
            'message' => is_array($data['raw'] ?? null) ? (string) ($data['raw']['message'] ?? '') : '',
        ];

        PaymentRealtimeEvent::dispatch(
            $fresh,
            PaymentMessageBuilder::eventName($parsed),
            PaymentMessageBuilder::forClient($fresh, $parsed)
        );
    }
}
