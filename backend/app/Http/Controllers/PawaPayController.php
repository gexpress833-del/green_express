<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Webhook pawaPay — rappel de dépôt (POST JSON).
 *
 * Corps attendu : depositId (uuid), status COMPLETED | PROCESSING | FAILED, etc.
 *
 * @see https://docs.pawapay.io/
 */
class PawaPayController extends Controller
{
    public function __construct(
        protected OrderNotificationService $orderNotifications
    ) {}

    public function callback(Request $request)
    {
        try {
            $rawBody = $request->getContent();
            $payload = json_decode($rawBody, true);

            if (! is_array($payload)) {
                $payload = $request->all();
            }

            if (! $this->verifyContentDigest($rawBody, $request->header('Content-Digest'))) {
                Log::warning('PawaPay Callback: invalid content digest');
                return response()->json(['message' => 'Invalid digest'], 403);
            }

            Log::info('PAWAPAY CALLBACK', $payload);

            $depositId = $payload['depositId'] ?? null;
            $statusRaw = $payload['status'] ?? '';
            $status = strtoupper((string) $statusRaw);

            if (! $depositId || $status === '') {
                Log::warning('PawaPay Callback: données invalides', ['payload' => $payload]);

                return response()->json(['message' => 'Invalid data'], 400);
            }

            $payment = Payment::query()
                ->where('provider', 'pawapay')
                ->where(function ($q) use ($depositId) {
                    $q->where('provider_payment_id', $depositId)
                        ->orWhere('reference_id', $depositId);
                })
                ->first();

            if (! $payment) {
                Log::warning('PawaPay Callback: paiement introuvable', ['depositId' => $depositId]);

                return response()->json(['message' => 'OK'], 200);
            }

            if ($status === 'COMPLETED') {
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
                    Log::info('PawaPay Payment Completed - Order Updated', [
                        'order_id' => $order->id,
                        'delivery_code' => $deliveryCode,
                    ]);
                }
            } elseif ($status === 'FAILED') {
                $failure = $payload['failureReason'] ?? null;
                $reasonText = is_array($failure)
                    ? ($failure['message'] ?? $failure['code'] ?? json_encode($failure))
                    : $failure;

                $payment->update([
                    'status' => 'failed',
                    'failure_reason' => is_string($reasonText) ? $reasonText : null,
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_callback' => $payload]),
                ]);

                if ($payment->order) {
                    $payment->order->update(['status' => 'cancelled']);
                    Log::info('PawaPay Payment Failed - Order Cancelled', [
                        'order_id' => $payment->order->id,
                    ]);
                }
            } else {
                // PROCESSING ou autre : rester en attente
                $payment->update([
                    'status' => 'pending',
                    'raw_response' => array_merge($payment->raw_response ?? [], ['last_callback' => $payload]),
                ]);
            }

            return response()->json(['message' => 'OK'], 200);
        } catch (\Exception $e) {
            Log::error('PawaPay webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Toujours 200 pour éviter les retries agressifs côté agrégateur
            return response()->json(['message' => 'OK'], 200);
        }
    }

    /**
     * Vérifie l'intégrité du body si Content-Digest est présent.
     * Format attendu: sha-256=:base64: ou sha-512=:base64:
     */
    private function verifyContentDigest(string $rawBody, ?string $digestHeader): bool
    {
        if (! $digestHeader) {
            return true;
        }

        if (! preg_match('/(sha-256|sha-512)=:([^:]+):/i', $digestHeader, $matches)) {
            return false;
        }

        $algo = strtolower($matches[1]) === 'sha-512' ? 'sha512' : 'sha256';
        $expected = base64_encode(hash($algo, $rawBody, true));

        return hash_equals($expected, $matches[2]);
    }
}
