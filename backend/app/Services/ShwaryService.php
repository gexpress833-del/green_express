<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Shwary\Enums\Country;
use Shwary\ShwaryClient;
use Shwary\Exceptions\ShwaryException;

class ShwaryService
{
    private ?ShwaryClient $client = null;

    public function __construct()
    {
        if (config('shwary.mock', false)) {
            return;
        }
        if (!empty(config('shwary.merchant_id')) && !empty(config('shwary.merchant_key'))) {
            $this->client = ShwaryClient::fromArray([
                'merchant_id' => config('shwary.merchant_id'),
                'merchant_key' => config('shwary.merchant_key'),
                'base_url' => config('shwary.base_url', 'https://api.shwary.com'),
                'sandbox' => config('shwary.sandbox', true),
                'timeout' => config('shwary.timeout', 30),
            ]);
        }
    }

    /**
     * Pays supportés par Shwary
     */
    public static function getSupportedCountries(): array
    {
        return [
            'DRC' => [
                'name' => 'République Démocratique du Congo',
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

    /**
     * Convertit le montant de la commande (souvent USD/XAF) vers la devise Shwary du pays.
     */
    public function convertToLocalAmount(float $amount, string $orderCurrency, string $countryCode): int
    {
        $countries = self::getSupportedCountries();
        if (!isset($countries[$countryCode])) {
            throw new Exception("Pays non supporté: {$countryCode}");
        }

        $rate = config("shwary.rates.{$countryCode}", 1);
        $defaultCurrency = config('shwary.default_order_currency', 'USD');

        // Si la commande est déjà dans la devise locale (CDF, KES, UGX), pas de conversion
        $localCurrency = $countries[$countryCode]['currency'];
        if (strtoupper($orderCurrency) === $localCurrency) {
            return (int) max($countries[$countryCode]['min_amount'], round($amount));
        }

        // Sinon appliquer le taux (ex: USD → CDF)
        $converted = $amount * $rate;
        $minAmount = $countries[$countryCode]['min_amount'];

        return (int) max($minAmount, round($converted));
    }

    /**
     * Valider le format du numéro de téléphone (E.164)
     */
    public function validatePhoneNumber(string $phoneNumber, string $countryCode): bool
    {
        $countries = self::getSupportedCountries();
        if (!isset($countries[$countryCode])) {
            throw new Exception("Pays non supporté: {$countryCode}");
        }

        $prefix = $countries[$countryCode]['prefix'];
        $phoneNumber = trim($phoneNumber);

        // Normaliser: ajouter + si absent, enlever 0 en tête
        if (!str_starts_with($phoneNumber, '+')) {
            $phoneNumber = $prefix . ltrim($phoneNumber, '0');
        }
        if (!str_starts_with($phoneNumber, $prefix)) {
            throw new Exception("Le numéro doit commencer par {$prefix} (ex: {$prefix}812345678)");
        }
        if (!preg_match('/^\+[1-9]\d{1,14}$/', $phoneNumber)) {
            throw new Exception("Format invalide. Utilisez E.164 (ex: {$prefix}812345678)");
        }

        return true;
    }

    /**
     * Normaliser le numéro pour l'API (retourne le numéro E.164 avec +)
     */
    public function normalizePhoneNumber(string $phoneNumber, string $countryCode): string
    {
        $countries = self::getSupportedCountries();
        $prefix = $countries[$countryCode]['prefix'] ?? '+243';
        $phoneNumber = preg_replace('/[\s\-\(\)]/', '', trim($phoneNumber));
        if (str_starts_with($phoneNumber, '+')) {
            return $phoneNumber;
        }
        // Enlever l'indicatif sans + (ex: 243 pour DRC) pour éviter +243243812345678
        $digitPrefix = ltrim($prefix, '+');
        if ($digitPrefix !== '' && str_starts_with($phoneNumber, $digitPrefix)) {
            $phoneNumber = substr($phoneNumber, strlen($digitPrefix));
        }
        $phoneNumber = $prefix . ltrim($phoneNumber, '0');
        return $phoneNumber;
    }

    /**
     * Initier un paiement via le SDK Shwary.
     *
     * @param int $amount Montant dans la devise locale (CDF, KES, UGX)
     * @param string $clientPhoneNumber Numéro E.164
     * @param string $countryCode DRC, KE, UG
     * @param string|null $callbackUrl URL de callback
     * @return array ['id', 'status', 'amount', 'currency', 'referenceId', ...]
     */
    public function initiatePayment(
        int $amount,
        string $clientPhoneNumber,
        string $countryCode,
        ?string $callbackUrl = null,
        array $metadata = []
    ): array {
        $countries = self::getSupportedCountries();
        $currency = $countries[$countryCode]['currency'] ?? 'CDF';

        // Mode mock (local / dev) : pas d'appel API, paiement considéré réussi
        if (config('shwary.mock', false)) {
            $mockId = 'mock_' . uniqid((string) mt_rand(), true);
            Log::info('Shwary payment mocked (no API call)', [
                'mock_id' => $mockId,
                'amount' => $amount,
                'currency' => $currency,
            ]);
            return [
                'id' => $mockId,
                'status' => 'completed',
                'amount' => $amount,
                'currency' => $currency,
                'referenceId' => $mockId,
            ];
        }

        if (!$this->client) {
            throw new Exception('Service de paiement Shwary non configuré (SHWARY_MERCHANT_ID / SHWARY_MERCHANT_KEY).');
        }

        $this->validatePhoneNumber($clientPhoneNumber, $countryCode);
        $phone = $this->normalizePhoneNumber($clientPhoneNumber, $countryCode);

        $country = $this->mapCountryCodeToEnum($countryCode);
        $callbackUrl = $callbackUrl
            ?: config('shwary.callback_url')
            ?: (rtrim(config('app.url'), '/') . '/api/shwary/callback');

        // Shwary n'accepte que des URLs HTTPS : en local (http), on n'envoie pas d'URL
        if ($callbackUrl !== null && !str_starts_with($callbackUrl, 'https://')) {
            $callbackUrl = null;
        }

        $isSandbox = config('shwary.sandbox', true);
        try {
            if ($isSandbox) {
                $transaction = $this->client->sandboxPay($amount, $phone, $country, $callbackUrl);
            } else {
                $transaction = $this->client->pay($amount, $phone, $country, $callbackUrl);
            }

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

    /**
     * Parser le payload webhook (pour le contrôleur callback).
     * Retourne un tableau [id, status, referenceId, ...] ou null si parsing échoue.
     */
    public function parseWebhookPayload(string $rawBody): ?array
    {
        if (!$this->client) {
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

    public function isConfigured(): bool
    {
        if (config('shwary.mock', false)) {
            return true;
        }
        return !empty(config('shwary.merchant_id')) && !empty(config('shwary.merchant_key'));
    }

    private function mapCountryCodeToEnum(string $countryCode): Country
    {
        return match (strtoupper($countryCode)) {
            'DRC' => Country::DRC,
            'KE' => Country::KENYA,
            'UG' => Country::UGANDA,
            default => throw new Exception("Pays non supporté: {$countryCode}"),
        };
    }
}
