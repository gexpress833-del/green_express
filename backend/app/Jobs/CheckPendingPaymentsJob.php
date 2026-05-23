<?php

namespace App\Jobs;

use App\Events\PaymentRealtimeEvent;
use App\Models\CompanySubscription;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\FlexPayService;
use App\Services\NotificationOrchestratorService;
use App\Services\Orders\OrderPaymentCompletionService;
use App\Services\Subscriptions\CompanySubscriptionPaymentCompletionService;
use App\Services\Subscriptions\SubscriptionPaymentCompletionService;
use App\Services\BeamsService;
use App\Support\PaymentMessageBuilder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckPendingPaymentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;

    public $timeout = 120;

    public function handle(
        FlexPayService $flexPayService,
        OrderPaymentCompletionService $orderPaymentCompletion,
        SubscriptionPaymentCompletionService $subscriptionPaymentCompletion,
        CompanySubscriptionPaymentCompletionService $companyPaymentCompletion,
        NotificationOrchestratorService $notifications,
        BeamsService $beams
    ): void
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

            $this->pollFlexPay(
                $payment,
                $flexPayService,
                $orderPaymentCompletion,
                $subscriptionPaymentCompletion,
                $companyPaymentCompletion,
                $notifications,
                $beams
            );
        }
    }

    private function pollFlexPay(
        Payment $payment,
        FlexPayService $flexPayService,
        OrderPaymentCompletionService $orderPaymentCompletion,
        SubscriptionPaymentCompletionService $subscriptionPaymentCompletion,
        CompanySubscriptionPaymentCompletionService $companyPaymentCompletion,
        NotificationOrchestratorService $notifications,
        BeamsService $beams
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
            if ($payment->order_id) {
                $order = Order::find($payment->order_id);
                if ($order) {
                    $orderPaymentCompletion->completeOrderAfterPayment($order);
                }
            }
            if ($payment->subscription_id) {
                $sub = Subscription::find($payment->subscription_id);
                if ($sub) {
                    $subscriptionPaymentCompletion->completeAfterPayment($sub);
                }
            }
            if ($payment->company_subscription_id) {
                $companySub = CompanySubscription::find($payment->company_subscription_id);
                if ($companySub) {
                    $companyPaymentCompletion->completeAfterPayment($companySub);
                }
            }
        } elseif (! empty($data['failed'])) {
            $payment->update([
                'status' => 'failed',
                'failure_reason' => 'Échec du paiement (vérification automatique)',
                'raw_response' => array_merge($payment->raw_response ?? [], ['last_poll' => $data['raw'] ?? $data]),
            ]);
            if ($payment->company_subscription_id) {
                $companySub = CompanySubscription::find($payment->company_subscription_id);
                if ($companySub) {
                    $companyPaymentCompletion->markFailed($companySub, 'Échec du paiement (vérification automatique)');
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

        $userId = null;
        if ($fresh->order) {
            $userId = $fresh->order->user_id;
        } elseif ($fresh->subscription) {
            $userId = $fresh->subscription->user_id;
        } elseif ($fresh->companySubscription && $fresh->companySubscription->company) {
            $userId = $fresh->companySubscription->company->contact_user_id;
        }

        if ($userId) {
            $eventName = PaymentMessageBuilder::eventName($parsed);
            $clientMessage = PaymentMessageBuilder::forClient($fresh, $parsed);
            $beams->sendToUser($userId, [
                'title' => $eventName === 'succeeded' ? 'Paiement réussi' : ($eventName === 'failed' ? 'Paiement échoué' : 'Paiement en cours'),
                'body' => $clientMessage,
                'deep_link' => $fresh->order_id ? '/client/orders' : ($fresh->subscription_id ? '/client/subscriptions' : '/entreprise/subscriptions'),
            ]);
        }
    }
}
