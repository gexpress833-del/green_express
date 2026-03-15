<?php

$baseUrl = rtrim(env('SHWARY_BASE_URL', 'https://api.shwary.com'), '/');
// Le SDK Shwary ajoute déjà "/api/v1" à la base URL : ne pas le mettre deux fois
if (preg_match('#/api/v1$#i', $baseUrl)) {
    $baseUrl = preg_replace('#/api/v1$#i', '', $baseUrl);
}

// En production : par défaut sandbox=false et mock=false (vrais paiements)
$isProduction = env('APP_ENV') === 'production';

return [
    'merchant_id' => env('SHWARY_MERCHANT_ID'),
    'merchant_key' => env('SHWARY_MERCHANT_KEY'),
    'base_url' => $baseUrl,
    'sandbox' => filter_var(env('SHWARY_SANDBOX', $isProduction ? false : true), FILTER_VALIDATE_BOOLEAN),
    'timeout' => (int) env('SHWARY_TIMEOUT', 30),
    // En local : simuler par défaut. En production : toujours false (vrais appels API).
    'mock' => filter_var(env('SHWARY_MOCK', env('APP_ENV') === 'local'), FILTER_VALIDATE_BOOLEAN),

    /*
    | URL de callback webhook (obligatoirement HTTPS pour Shwary).
    | En production : https://votre-domaine.com/api/shwary/callback
    | En local : utiliser ngrok puis définir ex. SHWARY_CALLBACK_URL=https://xxx.ngrok.io/api/shwary/callback
    */
    'callback_url' => env('SHWARY_CALLBACK_URL'),

    /*
    | Conversion des devises menu → devise Shwary (pour montant envoyé à l'API).
    | Ex: si le menu est en USD et le pays DRC, amount_cdf = order_total * rates.drc.
    */
    'rates' => [
        'DRC' => (float) env('SHWARY_RATE_USD_TO_CDF', 2500),   // 1 USD = 2500 CDF
        'KE' => (float) env('SHWARY_RATE_USD_TO_KES', 130),     // 1 USD = 130 KES
        'UG' => (float) env('SHWARY_RATE_USD_TO_UGX', 3800),   // 1 USD = 3800 UGX
    ],
    'default_order_currency' => env('SHWARY_DEFAULT_ORDER_CURRENCY', 'USD'),

    /*
    | Secret pour vérifier la signature des webhooks (recommandé en production).
    | Générer : php artisan key:generate ou php -r "echo bin2hex(random_bytes(32));"
    | Dans le dashboard Shwary : URL = https://votre-domaine.com/api/shwary/callback, clé secrète = cette valeur.
    | En-tête envoyé par Shwary : x-shwary-signature (HMAC-SHA256 du body en hex).
    */
    'webhook_secret' => env('SHWARY_WEBHOOK_SECRET') ?? env('PAYMENT_WEBHOOK_SECRET'),
];
