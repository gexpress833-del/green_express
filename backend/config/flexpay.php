<?php

/**
 * FlexPay / FlexPaie (RDC) — Mobile Money & cartes.
 *
 * Endpoints officiels production (Infoset / FlexPaie) :
 * - Mobile Money : POST …/paymentService
 * - Carte : POST https://cardpayment.flexpay.cd/v1.1/pay
 * - Vérification : GET …/check/{orderNumber} (hôte dédié apicheck en prod)
 *
 * @see https://github.com/devscast/flexpay-ts (contrat API public)
 */
$isProduction = env('APP_ENV') === 'production';

$paymentBaseFromLegacy = static function (?string $fullUrl): ?string {
    if ($fullUrl === null || $fullUrl === '') {
        return null;
    }
    $u = rtrim($fullUrl, '/');
    if (str_ends_with($u, '/paymentService')) {
        return substr($u, 0, -strlen('/paymentService'));
    }

    return $u;
};

$checkBaseFromLegacy = static function (?string $fullUrl): ?string {
    if ($fullUrl === null || $fullUrl === '') {
        return null;
    }
    $u = rtrim($fullUrl, '/');
    if (str_ends_with($u, '/check')) {
        return substr($u, 0, -strlen('/check'));
    }

    return $u;
};

return [
    'merchant' => env('FLEXPAY_MERCHANT'),
    /** Jeton JWT sans préfixe « Bearer » (Laravel l’ajoute). Alias : FLEXPAY_BEARER_TOKEN. */
    'token' => env('FLEXPAY_TOKEN') ?: env('FLEXPAY_BEARER_TOKEN'),
    /** prod = pas sandbox (alias FLEXPAY_SANDBOX=false → prod). */
    'env' => env('FLEXPAY_ENV', (function () use ($isProduction) {
        $sandbox = env('FLEXPAY_SANDBOX');
        if ($sandbox !== null && $sandbox !== '') {
            return filter_var($sandbox, FILTER_VALIDATE_BOOLEAN) ? 'dev' : 'prod';
        }

        return $isProduction ? 'prod' : 'dev';
    })()),

    /**
     * Base API pour initier un paiement Mobile Money.
     * Défaut prod : https://backend.flexpay.cd/api/rest/v1
     * Alias : FLEXPAY_BASE_URL peut pointer vers …/paymentService (tronqué automatiquement).
     */
    'payment_base_url' => env('FLEXPAY_PAYMENT_BASE_URL')
        ?: $paymentBaseFromLegacy(env('FLEXPAY_BASE_URL')),

    /**
     * Base API pour vérifier une transaction (numéro de commande FlexPay).
     * Défaut prod (mail FlexPaie) : https://apicheck.flexpaie.com/api/rest/v1
     * Alias : FLEXPAY_CHECK_URL peut finir par …/check (tronqué automatiquement).
     */
    'check_base_url' => env('FLEXPAY_CHECK_BASE_URL')
        ?: $checkBaseFromLegacy(env('FLEXPAY_CHECK_URL')),

    /** Paiement carte (Visa/Mastercard via FlexPay). Alias : FLEXPAY_CARD_URL. */
    'card_payment_url' => env('FLEXPAY_CARD_PAYMENT_URL')
        ?: env('FLEXPAY_CARD_URL', 'https://cardpayment.flexpay.cd/v1.1/pay'),

    /**
     * URL du frontend (Next.js) pour approveUrl / cancelUrl / declineUrl / homeUrl — requis par l’API carte FlexPay.
     * Ex. https://green-express-iota.vercel.app
     */
    'frontend_return_url' => rtrim((string) env('FRONTEND_URL', ''), '/'),

    /** Chemins relatifs sous frontend_return_url (sans slash initial). */
    'card_return_path' => trim((string) env('FLEXPAY_CARD_RETURN_PATH', 'entreprise/subscriptions'), '/'),

    'timeout' => (int) env('FLEXPAY_TIMEOUT', 30),

    /** true = aucun appel HTTP, réponses simulées (développement local). */
    'mock' => filter_var(env('FLEXPAY_MOCK', env('APP_ENV') === 'local'), FILTER_VALIDATE_BOOLEAN),

    'callback_url' => env('FLEXPAY_CALLBACK_URL'),

    /** Secret optionnel pour valider les webhooks (si FlexPay expose une signature documentée). */
    'webhook_secret' => env('FLEXPAY_WEBHOOK_SECRET') ?: env('PAYMENT_WEBHOOK_SECRET'),

    /** Taux indicatif USD → CDF si le montant commande est en USD et paiement en CDF. */
    'rate_usd_to_cdf' => (float) env('FLEXPAY_RATE_USD_TO_CDF', 2800),

    /** Montant minimum en CDF (aligné pratique Mobile Money RDC). */
    'min_amount_cdf' => (float) env('FLEXPAY_MIN_AMOUNT_CDF', 2900),
];
