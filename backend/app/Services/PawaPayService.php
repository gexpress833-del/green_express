<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class PawaPayService
{
    public function isConfigured(): bool
    {
        return ! empty(config('pawapay.api_token')) && ! empty(config('pawapay.base_url'));
    }

    /**
     * Montant au format attendu par pawaPay (évite les zéros non significatifs en fin de décimale).
     *
     * @see https://docs.pawapay.io/ (règles sur le champ amount)
     */
    public static function formatAmountForDeposit(float|string $amount): string
    {
        $num = is_numeric($amount)
            ? (float) $amount
            : (float) str_replace(',', '.', (string) $amount);
        if ($num < 0) {
            $num = 0.0;
        }
        $s = number_format($num, 3, '.', '');
        if (str_contains($s, '.')) {
            $s = rtrim(rtrim($s, '0'), '.');
        }
        if ($s === '' || $s === '-0') {
            return '0';
        }

        return $s;
    }

    /**
     * GET /v2/deposits/{depositId} — pour relance (job) si le webhook est manquant.
     *
     * @return array{depositId: string, status: string, raw: array}|null
     */
    public function getDepositStatus(string $depositId): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $url = rtrim(config('pawapay.base_url'), '/') . '/v2/deposits/' . $depositId;

        try {
            $response = Http::withToken(config('pawapay.api_token'))
                ->timeout((int) config('pawapay.timeout', 30))
                ->acceptJson()
                ->get($url);

            if (! $response->successful()) {
                Log::warning('PawaPay getDepositStatus HTTP error', [
                    'depositId' => $depositId,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $json = $response->json();
            if (($json['status'] ?? '') !== 'FOUND') {
                return null;
            }

            $data = $json['data'] ?? [];
            $status = strtoupper((string) ($data['status'] ?? ''));

            return [
                'depositId' => (string) ($data['depositId'] ?? $depositId),
                'status' => $status,
                'raw' => $json,
            ];
        } catch (\Throwable $e) {
            Log::warning('PawaPay getDepositStatus exception', [
                'depositId' => $depositId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * POST /v2/deposits
     *
     * @return array{depositId:string,status:string,raw:array}
     */
    public function initiateDeposit(array $payload): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Service de paiement non configuré.');
        }

        $url = rtrim(config('pawapay.base_url'), '/') . '/v2/deposits';

        try {
            $response = Http::withToken(config('pawapay.api_token'))
                ->timeout((int) config('pawapay.timeout', 30))
                ->acceptJson()
                ->asJson()
                ->post($url, $payload);

            $json = $response->json();
            if (! $response->successful()) {
                $message = $this->extractErrorMessage($json) ?: $response->body();
                throw new RuntimeException((string) $message);
            }

            $result = $this->unwrapDepositInitResponse($json);
            $depositId = (string) ($result['depositId'] ?? $payload['depositId'] ?? '');
            $status = strtoupper((string) ($result['status'] ?? ''));

            return [
                'depositId' => $depositId,
                'status' => $status,
                'raw' => is_array($json) ? $json : ['response' => $json],
            ];
        } catch (\Throwable $e) {
            Log::warning('PawaPay initiateDeposit exception', [
                'error' => $e->getMessage(),
                'payload_deposit_id' => $payload['depositId'] ?? null,
            ]);

            throw $e;
        }
    }

    private function unwrapDepositInitResponse(mixed $json): array
    {
        if (! is_array($json)) {
            return [];
        }

        // Cas 1: pawaPay répond avec un tableau d'objets (bulk ou single)
        if (array_is_list($json)) {
            $first = $json[0] ?? [];
            return is_array($first) ? $first : [];
        }

        // Cas 2: objet direct avec status/depositId
        if (isset($json['status']) || isset($json['depositId'])) {
            return $json;
        }

        // Cas 3: objet enveloppe avec data
        $data = $json['data'] ?? [];
        if (is_array($data)) {
            if (array_is_list($data)) {
                $first = $data[0] ?? [];
                return is_array($first) ? $first : [];
            }
            return $data;
        }

        return [];
    }

    private function extractErrorMessage(mixed $json): ?string
    {
        if (! is_array($json)) {
            return null;
        }

        $result = $this->unwrapDepositInitResponse($json);
        if (isset($result['failureReason'])) {
            $failure = $result['failureReason'];
            if (is_array($failure)) {
                return (string) ($failure['message'] ?? $failure['code'] ?? json_encode($failure));
            }
            return (string) $failure;
        }

        return $result['message'] ?? $json['message'] ?? null;
    }
}
