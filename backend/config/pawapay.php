<?php

/**
 * pawaPay Merchant API v2 — dépôts (Mobile Money).
 *
 * @see https://docs.pawapay.io/
 */
$baseUrl = rtrim(env('PAWAPAY_BASE_URL', 'https://api.sandbox.pawapay.io'), '/');

return [
    /*
    | Jeton API (Bearer). Généré dans le dashboard après configuration des URL de rappel.
    */
    'api_token' => env('PAWAPAY_API_TOKEN'),

    /*
    | Sandbox : https://api.sandbox.pawapay.io
    | Production : https://api.pawapay.io
    */
    'base_url' => $baseUrl,

    'timeout' => (int) env('PAWAPAY_TIMEOUT', 30),

    /*
    | URL enregistrée dans le dashboard (Deposits) — utile pour la doc / logs.
    | Ex. : https://green-express-rdc.onrender.com/api/pawapay/callback
    */
    'callback_url' => env('PAWAPAY_CALLBACK_URL'),

    /*
    | Si les rappels signés sont activés, implémenter la vérification RFC 9421 / Content-Digest
    | selon la doc pawaPay. Tant que vide, le callback accepte le JSON (HTTPS + idempotence sur depositId).
    */
    'webhook_secret' => env('PAWAPAY_WEBHOOK_SECRET'),

    /*
    | Conversion des codes pays legacy (projet) vers ISO alpha-3 (pawaPay).
    */
    'country_map' => [
        'DRC' => 'COD',
        'KE' => 'KEN',
        'UG' => 'UGA',
        'COD' => 'COD',
        'KEN' => 'KEN',
        'UGA' => 'UGA',
    ],

    /*
    | Devise par pays (fallback si la commande/abonnement n'a pas de devise explicite).
    */
    'currency_by_country' => [
        'COD' => 'CDF',
        'KEN' => 'KES',
        'UGA' => 'UGX',
    ],

    /*
    | Mapping opérateur RDC -> provider pawaPay.
    | Adapter ces valeurs selon les providers activés dans votre dashboard.
    */
    'provider_map' => [
        'COD' => [
            'vodacom' => env('PAWAPAY_PROVIDER_COD_VODACOM', 'VODACOM_MPESA_COD'),
            'airtel' => env('PAWAPAY_PROVIDER_COD_AIRTEL', 'AIRTEL_OAPI_COD'),
            'orange' => env('PAWAPAY_PROVIDER_COD_ORANGE', 'ORANGE_OAPI_COD'),
        ],
        'KEN' => [
            'default' => env('PAWAPAY_PROVIDER_KEN_DEFAULT', 'SAFARICOM_MPESA_KEN'),
            'airtel' => env('PAWAPAY_PROVIDER_KEN_AIRTEL', 'AIRTEL_OAPI_KEN'),
        ],
        'UGA' => [
            'default' => env('PAWAPAY_PROVIDER_UGA_DEFAULT', 'MTN_MOMO_UGA'),
            'airtel' => env('PAWAPAY_PROVIDER_UGA_AIRTEL', 'AIRTEL_OAPI_UGA'),
        ],
    ],
];
