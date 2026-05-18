<?php

namespace App\Services\Orders;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\FlexPayService;
use App\Services\OrderNotificationService;
use App\Services\PhoneRDCService;
use App\Support\ClientPaymentMessage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Initiation d’un débit Mobile Money FlexPay pour une commande (client ou admin).
 */
final class OrderFlexPayInitiationService
{
    public function __construct(
        private FlexPayService $flexPay,
        private OrderNotificationService $orderNotifications,
    ) {}

    /**
     * @param  array{client_phone_number: string, country_code: string}  $data
     * @return array{ok: true, data: array<string, mixed>}|array{ok: false, http_status: int, message: string, error?: string}
     */
    public function initiate(Order $order, User $user, array $data): array
    {
        if ($order->user_id !== $user->id && ! $user->canAsAdmin('orders.view')) {
            return ['ok' => false, 'http_status' => 403, 'message' => 'Non autorisé'];
        }

        if ($order->status !== 'pending_payment') {
            $hasCompleted = Payment::where('order_id', $order->id)->where('status', 'completed')->exists();
            $hasExplicitCancel = Payment::where('order_id', $order->id)->where('status', 'cancelled')->exists();
            if ($order->status === 'cancelled' && ! $hasCompleted && ! $hasExplicitCancel) {
                $order->update(['status' => 'pending_payment']);
            } else {
                return ['ok' => false, 'http_status' => 400, 'message' => 'Cette commande a déjà été payée ou ne peut pas être payée'];
            }
        }

        if (($data['country_code'] ?? '') !== 'DRC') {
            return ['ok' => false, 'http_status' => 422, 'message' => 'Pays non pris en charge pour ce flux.'];
        }

        try {
            if (! $this->flexPay->isConfigured()) {
                return [
                    'ok' => false,
                    'http_status' => 503,
                    'message' => 'Paiement Mobile Money temporairement indisponible. Réessayez plus tard ou contactez le support.',
                    'error' => 'payment_not_configured',
                ];
            }

            $formatted = PhoneRDCService::formatPhoneRDC($data['client_phone_number']);
            if (! PhoneRDCService::isValidPhoneRDC($formatted)) {
                return [
                    'ok' => false,
                    'http_status' => 400,
                    'message' => 'Numéro invalide. Utilisez un numéro à 9 chiffres (ex. 0812345678 ou 812345678).',
                    'error' => 'Numéro invalide',
                ];
            }
            $operator = PhoneRDCService::detectOperatorRDC($formatted);
            if ($operator === null) {
                return [
                    'ok' => false,
                    'http_status' => 400,
                    'message' => 'Opérateur non reconnu. Utilisez un numéro Vodacom (81–83), Airtel (97–99), Orange (84, 85, 89) ou Afrimoney / Africell (90–91).',
                    'error' => 'Opérateur non reconnu',
                ];
            }
            $phoneNormalized = PhoneRDCService::toE164($formatted);
            $phone12 = $formatted;

            $order->load('items.menu');
            $orderCurrency = $order->currency ?? $order->items->first()?->currency ?? $order->items->first()?->menu?->currency ?? 'CDF';
            $resolved = $this->flexPay->resolveAmountAndCurrency((float) $order->total_amount, (string) $orderCurrency);

            $reference = 'ORD-'.$order->id.'-'.Str::lower(Str::random(12));

            $callbackUrl = config('flexpay.callback_url')
                ?: (rtrim(config('app.url'), '/').'/api/flexpay/callback');

            $flexResponse = $this->flexPay->initiateMobilePayment(
                $resolved['amount'],
                $resolved['currency'],
                $phone12,
                $reference,
                'Commande #'.$order->id,
                $callbackUrl
            );

            $payment = Payment::create([
                'order_id' => $order->id,
                'provider' => 'flexpay',
                'provider_payment_id' => $flexResponse['id'],
                'reference_id' => $flexResponse['referenceId'] ?? $reference,
                'amount' => $flexResponse['amount'] ?? $resolved['amount'],
                'currency' => $flexResponse['currency'] ?? $resolved['currency'],
                'phone' => $phoneNormalized,
                'status' => 'pending',
                'raw_response' => $flexResponse,
            ]);

            $paymentStatus = $flexResponse['status'] ?? 'pending';
            if (strtolower((string) $paymentStatus) === 'completed') {
                $payment->update(['status' => 'completed']);
                if ($order->status === 'pending_payment') {
                    $oldStatus = (string) $order->status;
                    $deliveryCode = 'GX-'.strtoupper(Str::random(6));
                    while (Order::where('delivery_code', $deliveryCode)->exists()) {
                        $deliveryCode = 'GX-'.strtoupper(Str::random(6));
                    }
                    $order->update([
                        'status' => 'paid',
                        'delivery_code' => $deliveryCode,
                    ]);
                    $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid');
                }
            }

            $order->refresh();
            $payment->refresh();
            $deliveryCodeReturned = $order->delivery_code;

            return [
                'ok' => true,
                'data' => [
                    'order' => $order->load('items.menu'),
                    'payment' => $payment,
                    'flexpay_transaction' => $flexResponse,
                    'amount_to_debit' => $resolved['amount'],
                    'currency_to_debit' => $resolved['currency'],
                    'message' => $payment->status === 'completed'
                        ? 'Paiement complété. Code de livraison généré.'
                        : 'Paiement initié. En attente de confirmation sur votre mobile.',
                    'delivery_code' => $deliveryCodeReturned,
                    'payment_completed' => (bool) $deliveryCodeReturned,
                    'operator' => $operator,
                    'operator_label' => PhoneRDCService::operatorLabel($operator),
                    'phone_formatted' => $phoneNormalized,
                ],
            ];
        } catch (\Exception $e) {
            Log::warning('FlexPay initiate payment failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            $message = ClientPaymentMessage::sanitize($e->getMessage());
            if (stripos($message, 'destination number') !== false || stripos($message, 'number you have entered is invalid') !== false) {
                $message = 'Votre opérateur Mobile Money refuse le numéro. Utilisez 9 chiffres après +243 (ex: +243812345678 ou 0812345678).';
            } elseif (stripos($message, 'minimum') !== false && stripos($message, 'CDF') !== false) {
                $message = 'Le montant minimum pour un paiement Mobile Money en CDF n’est pas atteint pour cette commande.';
            }

            return [
                'ok' => false,
                'http_status' => 400,
                'message' => $message,
                'error' => $message,
            ];
        }
    }
}
