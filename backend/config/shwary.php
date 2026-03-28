<?php

$baseUrl = rtrim(env('SHWARY_BASE_URL', 'https://api.shwary.com'), '/');
if (preg_match('#/api/v1$#i', $baseUrl)) {
    $baseUrl = preg_replace('#/api/v1$#i', '', $baseUrl);
}

$isProduction = env('APP_ENV') === 'production';

return [
    'merchant_id' => env('SHWARY_MERCHANT_ID'),
    'merchant_key' => env('SHWARY_MERCHANT_KEY'),
    'base_url' => $baseUrl,
    'sandbox' => filter_var(env('SHWARY_SANDBOX', $isProduction ? false : true), FILTER_VALIDATE_BOOLEAN),
    'timeout' => (int) env('SHWARY_TIMEOUT', 30),
    'mock' => filter_var(env('SHWARY_MOCK', env('APP_ENV') === 'local'), FILTER_VALIDATE_BOOLEAN),

    'callback_url' => env('SHWARY_CALLBACK_URL'),

    'rates' => [
        'DRC' => (float) env('SHWARY_RATE_USD_TO_CDF', 2500),
        'KE' => (float) env('SHWARY_RATE_USD_TO_KES', 130),
        'UG' => (float) env('SHWARY_RATE_USD_TO_UGX', 3800),
    ],
    'default_order_currency' => env('SHWARY_DEFAULT_ORDER_CURRENCY', 'USD'),

    'webhook_secret' => env('SHWARY_WEBHOOK_SECRET') ?? env('PAYMENT_WEBHOOK_SECRET'),
];
