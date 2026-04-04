<?php

namespace App\Services;

/**
 * Normalisation, validation et détection d'opérateur pour les numéros RDC.
 */
class PhoneRDCService
{
    /**
     * Préfixes par opérateur (2 chiffres après 243).
     *
     * @var array<string, array<int, string>>
     */
    private const OPERATOR_PREFIXES = [
        'vodacom' => ['81', '82', '83'],
        'airtel' => ['97', '98', '99'],
        'orange' => ['84', '85', '89'],
        'africell' => ['90', '91'],
    ];

    /**
     * Normalise vers 243XXXXXXXXX (chiffres uniquement).
     */
    public static function formatPhoneRDC(string $phone): string
    {
        $phone = preg_replace('/\D/', '', trim($phone)) ?? '';

        if ($phone === '') {
            return '';
        }

        if (str_starts_with($phone, '0')) {
            $phone = '243' . substr($phone, 1);
        }

        if (strlen($phone) === 9) {
            $phone = '243' . $phone;
        }

        if (str_starts_with($phone, '243') && strlen($phone) > 12) {
            $phone = substr($phone, 0, 12);
        }

        return $phone;
    }

    /**
     * Vérifie : 243 + (8 ou 9) + 8 chiffres.
     */
    public static function isValidPhoneRDC(string $phone): bool
    {
        return (bool) preg_match('/^243(8|9)[0-9]{8}$/', $phone);
    }

    /**
     * @return 'vodacom'|'airtel'|'orange'|'africell'|null
     */
    public static function detectOperatorRDC(string $phone): ?string
    {
        if (strlen($phone) < 5) {
            return null;
        }

        $prefix = substr($phone, 3, 2);

        foreach (self::OPERATOR_PREFIXES as $operator => $prefixes) {
            if (in_array($prefix, $prefixes, true)) {
                return $operator;
            }
        }

        return null;
    }

    /**
     * Retourne le numéro au format E.164 (+243...).
     */
    public static function toE164(string $phone): string
    {
        $formatted = self::formatPhoneRDC($phone);

        if ($formatted === '') {
            return '';
        }

        return '+' . $formatted;
    }

    public static function operatorLabel(?string $operator): string
    {
        return match ($operator) {
            'vodacom' => 'Vodacom',
            'airtel' => 'Airtel',
            'orange' => 'Orange',
            'africell' => 'Africell',
            default => 'Inconnu',
        };
    }
}
