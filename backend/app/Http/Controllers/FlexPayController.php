<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\AppNotificationService;
use App\Services\FlexPayService;
use App\Services\OrderNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FlexPayController extends Controller
{
    public function __construct(
        protected FlexPayService $flexPayService,
        protected OrderNotificationService $orderNotifications,
        protected AppNotificationService $appNotifications
    ) {}

    public function callback(Request $request)
    {
        try {
            $rawBody = $request->getContent();
            $secret = config('flexpay.webhook_secret');
            if (! empty($secret)) {
                $signature = $request->header('X-FlexPay-Signature')
                    ?? $request->header('X-Webhook-Signature')
                    ?? $request->header('X-Signature');
                if (! $signature || ! $this->verifyWebhookSignature($rawBody, (string) $signature, $secret)) {
                    Log::warning('FlexPay Callback: signature invalide ou absente');

                    return response()->json(['message' => 'Invalid signature'], 403);
                }
            }

            $payload = json_decode($rawBody, true);
            if (! is_array($payload)) {
                $payload = $request->all();
            }

            Log::info('FLEXPAY CALLBACK', $payload);

            $parsed = $this->flexPayService->parseWebhookPayload($payload);
            if ($parsed === null) {
                Log::warning('FlexPay Callback: payload non reconnu', ['payload' => $payload]);

                return response()->json(['message' => 'Invalid data'], 400);
            }

            $orderNumber = $parsed['orderNumber'];
            $reference = $parsed['reference'];

            if (! $orderNumber && ! $reference) {
                Log::warning('FlexPay Callback: pas de référence', ['payload' => $payload]);

                return response()->json(['message' => 'Invalid data'], 400);
            }

            $q = Payment::query()->where('provider', 'flexpay');
            if ($orderNumber && $reference) {
                $payment = $q->where(function ($sub) use ($orderNumber, $reference) {
                    $sub->where('provider_payment_id', $orderNumber)->orWhere('reference_id', $reference);
                })->first();
            } elseif ($orderNumber) {
                $payment = $q->where('provider_payment_id', $orderNumber)->first();
            } else {
                $payment = $q->where('reference_id', $reference)->first();
            }

            if (! $payment) {
                Log::warning('FlexPay Callback: paiement introuvable', ['orderNumber' => $orderNumber, 'reference' => $reference]);

                return response()->json(['message' => 'OK'], 200);
            }

            if ($parsed['success']) {
                $payment->update([
                    'status' => 'completed',
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_callback' => $payload]),
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
                    $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid');
                }

                if ($payment->subscription_id) {
                    $sub = Subscription::find($payment->subscription_id);
                    if ($sub && $sub->isPending()) {
                        Subscription::applyPaymentConfirmedScheduling($sub, now());
                        $this->appNotifications->notifyClientAndAdminsAfterSubscriptionPayment($sub->fresh());
                    }
                }
            } elseif ($parsed['failure']) {
                $payment->update([
                    'status' => 'failed',
                    'failure_reason' => $parsed['message'] ?: 'Échec FlexPay',
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_callback' => $payload]),
                ]);

                if ($payment->order) {
                    $payment->order->update(['status' => 'cancelled']);
                }
            } else {
                $payment->update([
                    'status' => 'pending',
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_callback' => $payload]),
                ]);
            }

            return response()->json(['message' => 'OK'], 200);
        } catch (\Exception $e) {
            Log::error('FlexPay webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['message' => 'OK'], 200);
        }
    }

    private function verifyWebhookSignature(string $rawBody, string $signature, string $secret): bool
    {
        $expectedHex = hash_hmac('sha256', $rawBody, $secret);
        $expectedWithPrefix = 'sha256=' . $expectedHex;

        return hash_equals($expectedHex, $signature) || hash_equals($expectedWithPrefix, $signature);
    }
}
