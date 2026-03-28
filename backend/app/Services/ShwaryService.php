<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Shwary\Enums\Country;
use Shwary\Exceptions\ShwaryException;
use Shwary\ShwaryClient;

class ShwaryService
{
    private ?ShwaryClient $client = null;

    public function __construct()
    {
        if (config('shwary.mock', false)) {
            return;
        }

        if (! empty(config('shwary.merchant_id')) && ! empty(config('shwary.merchant_key'))) {
            $this->client = ShwaryClient::fromArray([
                'merchant_id' => config('shwary.merchant_id'),
                'merchant_key' => config('shwary.merchant_key'),
                'base_url' => config('shwary.base_url', 'https://api.shwary.com'),
                'sandbox' => config('shwary.sandbox', true),
                'timeout' => config('shwary.timeout', 30),
            ]);
        }
    }

    public static function getSupportedCountries(): array
    {
        return [
            'DRC' => [
                'name' => 'Republique Democratique du Congo',
                'code' => 'DRC',
                'prefix' => '+243',
                'currency' => 'CDF',
                'min_amount' => 2901,
            ],
            'KE' => [
                'name' => 'Kenya',
                'code' => 'KE',
                'prefix' => '+254',
                'currency' => 'KES',
                'min_amount' => 100,
            ],
            'UG' => [
                'name' => 'Ouganda',
                'code' => 'UG',
                'prefix' => '+256',
                'currency' => 'UGX',
                'min_amount' => 100,
            ],
        ];
    }

    public function convertToLocalAmount(float $amount, string $orderCurrency, string $countryCode): int
    {
        $countries = self::getSupportedCountries();
        if (! isset($countries[$countryCode])) {
            throw new Exception("Pays non supporte: {$countryCode}");
        }

        $rate = config("shwary.rates.{$countryCode}", 1);
        $localCurrency = $countries[$countryCode]['currency'];
        if (strtoupper($orderCurrency) === $localCurrency) {
            return (int) max($countries[$countryCode]['min_amount'], round($amount));
        }

        $converted = $amount * $rate;
        $minAmount = $countries[$countryCode]['min_amount'];

        return (int) max($minAmount, round($converted));
    }

    public function validatePhoneNumber(string $phoneNumber, string $countryCode): bool
    {
        $countries = self::getSupportedCountries();
        if (! isset($countries[$countryCode])) {
            throw new Exception("Pays non supporte: {$countryCode}");
        }

        $prefix = $countries[$countryCode]['prefix'];
        $phoneNumber = trim($phoneNumber);

        if (! str_starts_with($phoneNumber, '+')) {
            $phoneNumber = $prefix . ltrim($phoneNumber, '0');
        }
        if (! str_starts_with($phoneNumber, $prefix)) {
            throw new Exception("Le numero doit commencer par {$prefix} (ex: {$prefix}812345678)");
        }
        if (! preg_match('/^\+[1-9]\d{1,14}$/', $phoneNumber)) {
            throw new Exception("Format invalide. Utilisez E.164 (ex: {$prefix}812345678)");
        }

        return true;
    }

    public function normalizePhoneNumber(string $phoneNumber, string $countryCode): string
    {
        $countries = self::getSupportedCountries();
        $prefix = $countries[$countryCode]['prefix'] ?? '+243';
        $digitPrefix = ltrim($prefix, '+');
        $digitsOnly = preg_replace('/\D/', '', trim($phoneNumber));

        if ($digitsOnly === '') {
            throw new Exception('Numero de telephone requis.');
        }

        if ($digitPrefix !== '' && str_starts_with($digitsOnly, $digitPrefix)) {
            $digitsOnly = substr($digitsOnly, strlen($digitPrefix));
        }
        $digitsOnly = ltrim($digitsOnly, '0');

        if (strtoupper($countryCode) === 'DRC') {
            if (strlen($digitsOnly) > 9) {
                $digitsOnly = substr($digitsOnly, -9);
            }
            if (strlen($digitsOnly) < 9) {
                throw new Exception(
                    'Pour la RDC, le numero doit avoir 9 chiffres (ex: 812345678 ou 0812345678). Vous avez ' . strlen($digitsOnly) . ' chiffre(s).'
                );
            }
            $digitsOnly = substr($digitsOnly, -9);
        }

        return $prefix . $digitsOnly;
    }

    public function initiatePayment(
        int $amount,
        string $clientPhoneNumber,
        string $countryCode,
        ?string $callbackUrl = null,
        array $metadata = []
    ): array {
        $countries = self::getSupportedCountries();
        $currency = $countries[$countryCode]['currency'] ?? 'CDF';

        if (config('shwary.mock', false)) {
            $mockId = 'mock_' . uniqid((string) mt_rand(), true);
            Log::info('Shwary payment mocked', [
                'mock_id' => $mockId,
                'amount' => $amount,
                'currency' => $currency,
                'metadata' => $metadata,
            ]);

            return [
                'id' => $mockId,
                'status' => 'completed',
                'amount' => $amount,
                'currency' => $currency,
                'referenceId' => $mockId,
            ];
        }

        if (! $this->client) {
            throw new Exception('Service de paiement Shwary non configure (SHWARY_MERCHANT_ID / SHWARY_MERCHANT_KEY).');
        }

        $this->validatePhoneNumber($clientPhoneNumber, $countryCode);
        $phone = $this->normalizePhoneNumber($clientPhoneNumber, $countryCode);

        $country = $this->mapCountryCodeToEnum($countryCode);
        $callbackUrl = $callbackUrl
            ?: config('shwary.callback_url')
            ?: (rtrim(config('app.url'), '/') . '/api/shwary/callback');

        if ($callbackUrl !== null && ! str_starts_with($callbackUrl, 'https://')) {
            $callbackUrl = null;
        }

        $isSandbox = config('shwary.sandbox', true);

        try {
            $transaction = $isSandbox
                ? $this->client->sandboxPay($amount, $phone, $country, $callbackUrl)
                : $this->client->pay($amount, $phone, $country, $callbackUrl);

            Log::info('Shwary payment initiated', [
                'transaction_id' => $transaction->id,
                'status' => $transaction->status->value,
                'amount' => $transaction->amount,
            ]);

            return [
                'id' => $transaction->id,
                'status' => $transaction->status->value,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'referenceId' => $transaction->referenceId ?? $transaction->id,
            ];
        } catch (ShwaryException $e) {
            Log::error('Shwary payment error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);

            throw new Exception(
                'Paiement indisponible pour le moment. En local, activez SHWARY_MOCK=true dans .env pour simuler les paiements. Erreur : ' . $e->getMessage(),
                $e->getCode(),
                $e
            );
        }
    }

    public function parseWebhookPayload(string $rawBody): ?array
    {
        if (! $this->client) {
            return null;
        }

        try {
            $transaction = $this->client->parseWebhook($rawBody);

            return [
                'id' => $transaction->id,
                'status' => $transaction->status->value,
                'referenceId' => $transaction->referenceId ?? $transaction->id,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'failureReason' => $transaction->failureReason ?? null,
                'isCompleted' => $transaction->isCompleted(),
                'isFailed' => $transaction->isFailed(),
            ];
        } catch (\Throwable $e) {
            Log::warning('Shwary webhook parse error', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function getTransactionStatus(string $transactionId): ?array
    {
        if (config('shwary.mock', false)) {
            return null;
        }

        $merchantId = config('shwary.merchant_id');
        $merchantKey = config('shwary.merchant_key');
        if (empty($merchantId) || empty($merchantKey)) {
            return null;
        }

        $baseUrl = rtrim(config('shwary.base_url', 'https://api.shwary.com'), '/');
        $path = str_contains($baseUrl, '/api/v1')
            ? '/merchants/transactions/' . $transactionId
            : '/api/v1/merchants/transactions/' . $transactionId;
        $url = $baseUrl . $path;
        if (! str_contains($path, '/api/v1')) {
            $url = $baseUrl . '/api/v1/merchants/transactions/' . $transactionId;
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'x-merchant-id' => $merchantId,
                    'x-merchant-key' => $merchantKey,
                    'Accept' => 'application/json',
                ])
                ->get($url);

            if (! $response->successful()) {
                Log::debug('Shwary getTransactionStatus non 2xx', [
                    'id' => $transactionId,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $body = $response->json();
            $status = $body['status'] ?? $body['transactionStatus'] ?? null;
            if ($status === null) {
                return null;
            }

            return [
                'status' => strtolower((string) $status),
                'failureReason' => $body['failureReason'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::warning('Shwary getTransactionStatus error', [
                'id' => $transactionId,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function isConfigured(): bool
    {
        if (config('shwary.mock', false)) {
            return true;
        }

        return ! empty(config('shwary.merchant_id')) && ! empty(config('shwary.merchant_key'));
    }

    private function mapCountryCodeToEnum(string $countryCode): Country
    {
        return match (strtoupper($countryCode)) {
            'DRC' => Country::DRC,
            'KE' => Country::KENYA,
            'UG' => Country::UGANDA,
            default => throw new Exception("Pays non supporte: {$countryCode}"),
        };
    }
}
