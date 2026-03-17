<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderNotificationService;
use App\Services\ShwaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ShwaryController extends Controller
{
    public function __construct(
        protected ShwaryService $shwaryService,
        protected OrderNotificationService $orderNotifications
    ) {}

    /**
     * Webhook callback Shwary — stratégie stricte sans retry.
     * completed → commande paid + code livraison
     * failed → commande cancelled
     * Toujours répondre 200 et rapidement.
     */
    public function callback(Request $request)
    {
        try {
            $rawBody = $request->getContent();
            $secret = config('shwary.webhook_secret');
            if (!empty($secret)) {
                $signature = $request->header('X-Shwary-Signature')
                    ?? $request->header('X-Webhook-Signature')
                    ?? $request->header('X-Signature');
                if (!$signature || !$this->verifyWebhookSignature($rawBody, $signature, $secret)) {
                    Log::warning('Shwary Callback: Invalid or missing signature');
                    return response()->json(['message' => 'Invalid signature'], 403);
                }
            }

            Log::info('SHWARY CALLBACK', $request->all());

            $data = $this->shwaryService->parseWebhookPayload($rawBody);
            if (!$data) {
                $data = $request->all();
            }

            $transactionId = $data['id'] ?? $data['transactionId'] ?? null;
            $referenceId = $data['referenceId'] ?? $transactionId;
            $status = strtolower((string) ($data['status'] ?? ''));

            if (!$transactionId || $status === '') {
                Log::warning('Shwary Callback: Invalid data', ['data' => $data]);
                return response()->json(['message' => 'Invalid data'], 400);
            }

            $payment = Payment::where('provider_payment_id', $transactionId)
                ->orWhere('reference_id', $referenceId)
                ->first();

            if (!$payment) {
                Log::warning('Payment introuvable', $data);
                return response()->json(['message' => 'OK'], 200);
            }

            Log::info('Payment found', [
                'id' => $payment->id,
                'status' => $status,
            ]);

            if ($status === 'completed') {
                $payment->update([
                    'status' => 'completed',
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_callback' => $data]),
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
                    Log::info('Shwary Payment Completed - Order Updated', [
                        'order_id' => $order->id,
                        'delivery_code' => $deliveryCode,
                    ]);
                }
            } elseif ($status === 'failed') {
                $payment->update([
                    'status' => 'failed',
                    'failure_reason' => $data['failureReason'] ?? null,
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_callback' => $data]),
                ]);

                if ($payment->order) {
                    $payment->order->update(['status' => 'cancelled']);
                    Log::info('Shwary Payment Failed - Order Cancelled', [
                        'order_id' => $payment->order->id,
                        'failure_reason' => $data['failureReason'] ?? null,
                    ]);
                }
            } else {
                $payment->update(['status' => 'pending']);
            }

            return response()->json(['message' => 'OK'], 200);
        } catch (\Exception $e) {
            Log::error('Webhook error', [
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
