<?php

namespace App\Http\Controllers;

use App\Events\PaymentRealtimeEvent;
use App\Models\CompanySubscription;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\FlexPayService;
use App\Services\NotificationOrchestratorService;
use App\Services\OrderNotificationService;
use App\Services\BeamsService;
use App\Support\PaymentMessageBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FlexPayController extends Controller
{
    public function __construct(
        protected FlexPayService $flexPayService,
        protected OrderNotificationService $orderNotifications,
        protected NotificationOrchestratorService $notifications,
        protected BeamsService $beams
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

            DB::transaction(function () use ($payment, $parsed, $payload) {
                $payment = Payment::query()->lockForUpdate()->find($payment->id);
                if (! $payment) {
                    return;
                }

                $raw = array_merge($payment->raw_response ?? [], ['last_callback' => $payload]);

                if ($parsed['success']) {
                    if ($payment->status !== 'completed') {
                        $payment->update([
                            'status' => 'completed',
                            'failure_reason' => null,
                            'raw_response' => $raw,
                        ]);
                    } else {
                        $payment->update(['raw_response' => $raw]);
                    }

                    if ($payment->order_id) {
                        $order = Order::query()->lockForUpdate()->find($payment->order_id);
                        if ($order && $order->status === 'pending_payment') {
                            $oldStatus = (string) $order->status;
                            $deliveryCode = $order->delivery_code;
                            if (! $deliveryCode) {
                                $deliveryCode = 'GX-' . strtoupper(Str::random(6));
                                while (Order::where('delivery_code', $deliveryCode)->exists()) {
                                    $deliveryCode = 'GX-' . strtoupper(Str::random(6));
                                }
                            }
                            $order->update([
                                'status' => 'paid',
                                'delivery_code' => $deliveryCode,
                            ]);
                            $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid');
                        }
                    }

                    if ($payment->subscription_id) {
                        $sub = Subscription::query()->lockForUpdate()->find($payment->subscription_id);
                        if ($sub && $sub->isPending()) {
                            Subscription::applyPaymentConfirmedScheduling($sub, now());
                            $this->notifications->notifyClientAndAdminsAfterSubscriptionPayment($sub->fresh());
                        }
                    }

                    if ($payment->company_subscription_id) {
                        $companySub = CompanySubscription::query()->lockForUpdate()->find($payment->company_subscription_id);
                        if ($companySub && $companySub->status === 'pending' && $companySub->payment_status !== 'paid') {
                            $companySub->update(['payment_status' => 'paid']);
                            $this->notifications->notifyCompanySubscriptionPaymentConfirmed($companySub->fresh());
                        }
                    }

                    return;
                }

                if ($parsed['failure']) {
                    if (! in_array($payment->status, ['completed', 'failed'], true)) {
                        $payment->update([
                            'status' => 'failed',
                            'failure_reason' => $parsed['message'] ?: 'Échec FlexPay',
                            'raw_response' => $raw,
                        ]);
                    } else {
                        $payment->update(['raw_response' => $raw]);
                    }

                    if ($payment->company_subscription_id) {
                        $companySub = CompanySubscription::query()->lockForUpdate()->find($payment->company_subscription_id);
                        if ($companySub && $companySub->status === 'pending' && $companySub->payment_status !== 'paid') {
                            $companySub->update(['payment_status' => 'failed']);
                            $this->notifications->notifyCompanySubscriptionPaymentFailed(
                                $companySub->fresh(),
                                $parsed['message'] ?: $payment->failure_reason
                            );
                        }
                    }

                    // Important : on NE marque PAS la commande comme 'cancelled' ici.
                    // On garde Order.status='pending_payment' pour permettre au client
                    // de reessayer le paiement (solde, USSD non confirme...) ou d'annuler
                    // explicitement via le bouton "Annuler la commande" (cancelOwn).
                    return;
                }

                // Pending / unknown status
                if ($payment->status !== 'completed') {
                    $payment->update([
                        'status' => 'pending',
                        'raw_response' => $raw,
                    ]);
                } else {
                    $payment->update(['raw_response' => $raw]);
                }
            });

            $fresh = $payment->fresh();
            if ($fresh) {
                $clientMessage = PaymentMessageBuilder::forClient($fresh, $parsed);
                $eventName = PaymentMessageBuilder::eventName($parsed);
                PaymentRealtimeEvent::dispatch($fresh, $eventName, $clientMessage);

                $userId = null;
                if ($fresh->order) {
                    $userId = $fresh->order->user_id;
                } elseif ($fresh->subscription) {
                    $userId = $fresh->subscription->user_id;
                } elseif ($fresh->companySubscription && $fresh->companySubscription->company) {
                    $userId = $fresh->companySubscription->company->contact_user_id;
                }

                if ($userId) {
                    $this->beams->sendToUser($userId, [
                        'title' => $eventName === 'succeeded' ? 'Paiement réussi' : ($eventName === 'failed' ? 'Paiement échoué' : 'Paiement en cours'),
                        'body' => $clientMessage,
                        'deep_link' => $fresh->order_id ? '/client/orders' : ($fresh->subscription_id ? '/client/subscriptions' : '/entreprise/subscriptions'),
                    ]);
                }
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
