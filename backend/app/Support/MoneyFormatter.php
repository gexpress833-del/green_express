<?php

namespace App\Support;

final class MoneyFormatter
{
    public static function format(float $amount, string $currency): string
    {
        $currency = strtoupper(trim($currency));
        if ($currency === 'CDF') {
            return number_format(round($amount), 0, ',', "\u{202f}").' FC';
        }
        if ($currency === 'USD') {
            return number_format($amount, 2, '.', ',').' USD';
        }

        return number_format($amount, 2, '.', ',').' '.$currency;
    }
}
