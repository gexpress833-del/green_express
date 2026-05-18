<?php

namespace App\Support;

use App\Models\Menu;
use App\Models\PricingTier;

/**
 * Équivalent PHP de {@see frontend-next/app/lib/currencyPreference.js} (convertMenuPrice).
 * Le panier et la commande utilisent une devise d’affichage unique ; les prix sont convertis via le taux USD/CDF.
 */
final class MenuPriceConverter
{
    public const DEFAULT_USD_CDF_RATE = 2800.0;

    public static function normalizeCurrency(?string $value): string
    {
        $c = strtoupper(trim((string) $value));

        return $c === 'USD' ? 'USD' : 'CDF';
    }

    /**
     * Même source que {@see \App\Http\Controllers\CurrencyController::showRate()} (GET /api/currency/rate).
     */
    public static function defaultUsdCdfRate(): float
    {
        $tier = PricingTier::query()->where('plan_name', 'Green Express')->first()
            ?: PricingTier::query()->where('is_active', true)->orderBy('id')->first();

        $rate = $tier ? (float) $tier->exchange_rate : self::DEFAULT_USD_CDF_RATE;

        return $rate > 0 ? $rate : self::DEFAULT_USD_CDF_RATE;
    }

    /**
     * @return array{price: float, currency: string, original_price: float, original_currency: string, converted: bool, rate: float}
     */
    public static function convert(float $price, string $sourceCurrency, string $targetCurrency, float $usdCdfRate): array
    {
        $source = self::normalizeCurrency($sourceCurrency);
        $target = self::normalizeCurrency($targetCurrency);
        $rate = $usdCdfRate > 0 ? $usdCdfRate : self::DEFAULT_USD_CDF_RATE;

        if ($source === $target) {
            return [
                'price' => $price,
                'currency' => $target,
                'original_price' => $price,
                'original_currency' => $source,
                'converted' => false,
                'rate' => $rate,
            ];
        }

        if ($source === 'USD' && $target === 'CDF') {
            return [
                'price' => (float) round($price * $rate),
                'currency' => $target,
                'original_price' => $price,
                'original_currency' => $source,
                'converted' => true,
                'rate' => $rate,
            ];
        }

        if ($source === 'CDF' && $target === 'USD') {
            return [
                'price' => round(($price / $rate) * 100) / 100,
                'currency' => $target,
                'original_price' => $price,
                'original_currency' => $source,
                'converted' => true,
                'rate' => $rate,
            ];
        }

        return [
            'price' => $price,
            'currency' => $source,
            'original_price' => $price,
            'original_currency' => $source,
            'converted' => false,
            'rate' => $rate,
        ];
    }

    /**
     * @return array{price: float, currency: string, original_price: float, original_currency: string, converted: bool, rate: float}
     */
    public static function convertMenu(Menu $menu, string $targetCurrency, float $usdCdfRate): array
    {
        $price = (float) $menu->price;
        $source = self::normalizeCurrency((string) ($menu->currency ?? 'CDF'));

        return self::convert($price, $source, $targetCurrency, $usdCdfRate);
    }
}
