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
            throw new Exception('Devise non supportée pour ce paiement (USD ou CDF uniquement).');
        }

        if (strlen($phone12Digits) !== 12 || ! preg_match('/^243\d{9}$/', $phone12Digits)) {
            throw new Exception('Numéro invalide : 12 chiffres attendus (ex. 243812345678).');
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

                throw new Exception($data['message'] ?? 'Erreur du service de paiement (HTTP ' . $response->status() . ').');
            }

            $code = isset($data['code']) ? (int) $data['code'] : 1;
            if ($code !== 0) {
                throw new Exception($data['message'] ?? 'Paiement refusé par l’opérateur Mobile Money.');
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

            throw new Exception('Paiement Mobile Money temporairement indisponible.', 0, $e);
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
    /**
     * URLs de retour pour le flux carte (FlexPay exige homeUrl, approveUrl, cancelUrl, declineUrl).
     *
     * @return array{homeUrl: string, approveUrl: string, cancelUrl: string, declineUrl: string}
     */
    public function buildCardReturnUrls(): array
    {
        $base = rtrim((string) config('flexpay.frontend_return_url', ''), '/');
        if ($base === '') {
            $base = rtrim((string) config('app.url'), '/');
        }
        $path = trim((string) config('flexpay.card_return_path', 'entreprise/subscriptions'), '/');
        $suffix = $path !== '' ? '/'.$path : '';
        $home = $base.$suffix;

        return [
            'homeUrl' => $home,
            'approveUrl' => $home.'?card=approved',
            'cancelUrl' => $home.'?card=cancelled',
            'declineUrl' => $home.'?card=declined',
        ];
    }

    /**
     * Référence carte FlexPay : max. 25 caractères (contrainte API).
     */
    public function buildCompanyCardReference(int $companySubscriptionId): string
    {
        $suffix = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
        $core = 'C'.str_pad((string) min($companySubscriptionId, 99_999_999), 8, '0', STR_PAD_LEFT).$suffix;

        return strlen($core) > 25 ? substr($core, 0, 25) : $core;
    }

    /**
     * Initie un paiement carte (Visa/Mastercard) — redirection vers $response['url'].
     *
     * @return array{id: string, status: string, amount: float, currency: string, referenceId: string, url: string, raw: array}
     */
    public function initiateCardPayment(
        float $amount,
        string $currency,
        string $reference,
        string $description,
        ?string $callbackUrl = null
    ): array {
        $currency = strtoupper($currency);
        if (! in_array($currency, ['USD', 'CDF'], true)) {
            throw new Exception('Devise non supportée pour ce paiement (USD ou CDF uniquement).');
        }

        $ref = strlen($reference) > 25 ? substr($reference, 0, 25) : $reference;
        if ($ref === '') {
            throw new Exception('Référence de paiement invalide.');
        }

        $urls = $this->buildCardReturnUrls();
        $callbackUrl = $callbackUrl
            ?: config('flexpay.callback_url')
            ?: (rtrim(config('app.url'), '/') . '/api/flexpay/callback');

        if (config('flexpay.mock')) {
            $mockOrder = 'mock_card_' . uniqid('', true);

            return [
                'id' => $mockOrder,
                'status' => 'pending',
                'amount' => $amount,
                'currency' => $currency,
                'referenceId' => $ref,
                'url' => $urls['homeUrl'] . '?card=mock&order=' . urlencode($mockOrder),
                'raw' => ['code' => 0, 'orderNumber' => $mockOrder, 'message' => 'mock_card'],
            ];
        }

        $token = $this->tokenForHttp();
        $body = [
            'merchant' => config('flexpay.merchant'),
            'authorization' => 'Bearer ' . $token,
            'amount' => $amount,
            'currency' => $currency,
            'reference' => $ref,
            'description' => $description !== '' ? $description : 'Paiement carte',
            'callbackUrl' => $callbackUrl,
            'homeUrl' => $urls['homeUrl'],
            'approveUrl' => $urls['approveUrl'],
            'cancelUrl' => $urls['cancelUrl'],
            'declineUrl' => $urls['declineUrl'],
        ];

        $url = rtrim((string) config('flexpay.card_payment_url'), '/');

        try {
            $response = Http::timeout((int) config('flexpay.timeout', 30))
                ->withToken($token)
                ->acceptJson()
                ->asJson()
                ->post($url, $body);

            $data = $response->json() ?? [];

            if (! $response->successful()) {
                Log::warning('FlexPay card initiate HTTP error', ['status' => $response->status(), 'body' => $data]);

                throw new Exception($data['message'] ?? 'Erreur du service de paiement carte (HTTP ' . $response->status() . ').');
            }

            $code = isset($data['code']) ? (int) $data['code'] : 1;
            if ($code !== 0) {
                throw new Exception($data['message'] ?? 'Paiement carte refusé ou indisponible.');
            }

            $payUrl = $data['url'] ?? null;
            if (! is_string($payUrl) || $payUrl === '') {
                throw new Exception('Réponse FlexPay carte sans URL de paiement.');
            }

            $orderNumber = $data['orderNumber'] ?? $ref;

            return [
                'id' => (string) $orderNumber,
                'status' => 'pending',
                'amount' => $amount,
                'currency' => $currency,
                'referenceId' => $ref,
                'url' => $payUrl,
                'raw' => $data,
            ];
        } catch (\Throwable $e) {
            if ($e instanceof Exception) {
                throw $e;
            }
            Log::error('FlexPay card initiate exception', ['message' => $e->getMessage()]);

            throw new Exception('Paiement par carte temporairement indisponible.', 0, $e);
        }
    }

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
