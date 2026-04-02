<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Client HTTP FlexPay (API REST v1) — RDC.
 *
 * Vérification transaction : en production, hôte documenté par FlexPaie
 * `https://apicheck.flexpaie.com/api/rest/v1/check/{orderNumber}`.
 *
 * @see https://github.com/devscast/flexpay-ts
 */
class FlexPayService
{
    public function isConfigured(): bool
    {
        if (config('flexpay.mock')) {
            return true;
        }

        return ! empty(config('flexpay.merchant')) && $this->tokenForHttp() !== '';
    }

    /** JWT FlexPay : valeur seule ou préfixée « Bearer » (collage depuis l’e-mail Infoset). */
    private function tokenForHttp(): string
    {
        $t = trim((string) config('flexpay.token', ''));
        if ($t !== '' && str_starts_with($t, 'Bearer ')) {
            $t = trim(substr($t, 7));
        }

        return $t;
    }

    /** Base pour POST …/paymentService (Mobile Money). */
    public function getPaymentBaseUrl(): string
    {
        $override = config('flexpay.payment_base_url');
        if (is_string($override) && $override !== '') {
            return rtrim($override, '/');
        }

        return config('flexpay.env') === 'prod'
            ? 'https://backend.flexpay.cd/api/rest/v1'
            : 'https://beta-backend.flexpay.cd/api/rest/v1';
    }

    /**
     * Base pour GET …/check/{orderNumber}.
     * Production : apicheck.flexpaie.com (documentation FlexPaie / Infoset).
     */
    public function getCheckBaseUrl(): string
    {
        $override = config('flexpay.check_base_url');
        if (is_string($override) && $override !== '') {
            return rtrim($override, '/');
        }

        if (config('flexpay.env') === 'prod') {
            return 'https://apicheck.flexpaie.com/api/rest/v1';
        }

        return 'https://beta-backend.flexpay.cd/api/rest/v1';
    }

    /**
     * @return array{id: string, status: string, amount: float, currency: string, referenceId: string, raw: array}
     */
    public function initiateMobilePayment(
        float $amount,
        string $currency,
        string $phone12Digits,
        string $reference,
        string $description,
        ?string $callbackUrl = null
    ): array {
        $currency = strtoupper($currency);
        if (! in_array($currency, ['USD', 'CDF'], true)) {
            throw new Exception('Devise non supportée par FlexPay (USD ou CDF uniquement).');
        }

        if (strlen($phone12Digits) !== 12 || ! preg_match('/^243\d{9}$/', $phone12Digits)) {
            throw new Exception('Numéro FlexPay invalide : 12 chiffres attendus (ex. 243812345678).');
        }

        if (config('flexpay.mock')) {
            $mockOrder = 'mock_' . uniqid('', true);

            return [
                'id' => $mockOrder,
                'status' => 'pending',
                'amount' => $amount,
                'currency' => $currency,
                'referenceId' => $reference,
                'raw' => ['code' => 0, 'orderNumber' => $mockOrder, 'message' => 'mock'],
            ];
        }

        $callbackUrl = $callbackUrl
            ?: config('flexpay.callback_url')
            ?: (rtrim(config('app.url'), '/') . '/api/flexpay/callback');

        $body = [
            'merchant' => config('flexpay.merchant'),
            'type' => 1,
            'amount' => $amount,
            'currency' => $currency,
            'phone' => $phone12Digits,
            'reference' => $reference,
            'description' => $description,
            'callbackUrl' => $callbackUrl,
        ];

        $url = $this->getPaymentBaseUrl() . '/paymentService';

        try {
            $response = Http::timeout((int) config('flexpay.timeout', 30))
                ->withToken($this->tokenForHttp())
                ->acceptJson()
                ->asJson()
                ->post($url, $body);

            $data = $response->json() ?? [];

            if (! $response->successful()) {
                Log::warning('FlexPay initiate HTTP error', ['status' => $response->status(), 'body' => $data]);

                throw new Exception($data['message'] ?? 'Erreur FlexPay (HTTP ' . $response->status() . ').');
            }

            $code = isset($data['code']) ? (int) $data['code'] : 1;
            if ($code !== 0) {
                throw new Exception($data['message'] ?? 'Paiement refusé par FlexPay.');
            }

            $orderNumber = $data['orderNumber'] ?? $reference;

            return [
                'id' => (string) $orderNumber,
                'status' => 'pending',
                'amount' => $amount,
                'currency' => $currency,
                'referenceId' => $reference,
                'raw' => $data,
            ];
        } catch (\Throwable $e) {
            if ($e instanceof Exception) {
                throw $e;
            }
            Log::error('FlexPay initiate exception', ['message' => $e->getMessage()]);

            throw new Exception('Paiement indisponible : ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * @return array{paid: bool, failed: bool, raw: array}|null
     */
    public function checkTransaction(string $orderNumber): ?array
    {
        if (config('flexpay.mock')) {
            return null;
        }

        $url = $this->getCheckBaseUrl() . '/check/' . rawurlencode($orderNumber);

        try {
            $response = Http::timeout(15)
                ->withToken($this->tokenForHttp())
                ->acceptJson()
                ->get($url);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json() ?? [];
            $tx = $data['transaction'] ?? null;
            if (! is_array($tx)) {
                return null;
            }

            $st = isset($tx['status']) ? (int) $tx['status'] : null;
            if ($st === null) {
                return null;
            }

            return [
                'paid' => $st === 0,
                'failed' => $st === 1,
                'raw' => $data,
            ];
        } catch (\Throwable $e) {
            Log::warning('FlexPay check error', ['orderNumber' => $orderNumber, 'message' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Prépare montant + devise pour FlexPay (USD ou CDF uniquement).
     *
     * @return array{amount: float, currency: string}
     */
    public function resolveAmountAndCurrency(float $amount, string $orderCurrency): array
    {
        $c = strtoupper(trim($orderCurrency));
        if ($c === 'CDF' || $c === 'FC') {
            $min = (float) config('flexpay.min_amount_cdf', 2900);
            if ($amount < $min) {
                throw new Exception(
                    'Le montant minimum pour un paiement Mobile Money en CDF est de ' . (int) $min . ' FC.'
                );
            }

            return ['amount' => round($amount, 2), 'currency' => 'CDF'];
        }

        if ($c === 'USD') {
            return ['amount' => round($amount, 2), 'currency' => 'USD'];
        }

        $rate = (float) config('flexpay.rate_usd_to_cdf', 2800);
        $cdf = round($amount * $rate, 2);
        $min = (float) config('flexpay.min_amount_cdf', 2900);
        if ($cdf < $min) {
            throw new Exception(
                'Le montant minimum pour un paiement Mobile Money en CDF est de ' . (int) $min . ' FC après conversion.'
            );
        }

        return ['amount' => $cdf, 'currency' => 'CDF'];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{orderNumber: ?string, reference: ?string, success: bool, failure: bool, message: string}|null
     */
    public function parseWebhookPayload(array $payload): ?array
    {
        $code = null;
        if (array_key_exists('code', $payload)) {
            $code = (int) $payload['code'];
        }
        if (isset($payload['transaction']) && is_array($payload['transaction'])) {
            $tx = $payload['transaction'];
            if (array_key_exists('status', $tx)) {
                $code = (int) $tx['status'];
            }
        }

        $orderNumber = $payload['orderNumber'] ?? $payload['order_number'] ?? null;
        if ($orderNumber === null && isset($payload['transaction']['orderNumber'])) {
            $orderNumber = $payload['transaction']['orderNumber'];
        }

        $reference = $payload['reference'] ?? null;
        if ($reference === null && isset($payload['transaction']['reference'])) {
            $reference = $payload['transaction']['reference'];
        }

        if ($code === null) {
            return null;
        }

        return [
            'orderNumber' => $orderNumber !== null ? (string) $orderNumber : null,
            'reference' => $reference !== null ? (string) $reference : null,
            'success' => $code === 0,
            'failure' => $code === 1,
            'message' => (string) ($payload['message'] ?? ''),
        ];
    }
}
