<?php

namespace App\Services;

/**
 * Normalisation, validation et détection d'opérateur pour les numéros RDC (Mobile Money).
 * Objectif : accepter n'importe quel format, le corriger, détecter l'opérateur, éviter les erreurs Shwary.
 */
class PhoneRDCService
{
    /** Préfixes par opérateur (2 chiffres après 243). */
    private const OPERATOR_PREFIXES = [
        'vodacom' => ['81', '82', '83'],
        'airtel'  => ['97', '98', '99'],
        'orange'  => ['84', '85', '89'],
    ];

    /**
     * Normalise n'importe quel format vers 243XXXXXXXXX (chiffres uniquement).
     * Ex. : 0991234567, +243 99 123 4567, 991234567 → 243991234567
     */
    public static function formatPhoneRDC(string $phone): string
    {
        $phone = preg_replace('/\D/', '', trim($phone));

        if ($phone === '') {
            return '';
        }

        // 0991234567 → 243991234567
        if (str_starts_with($phone, '0')) {
            $phone = '243' . substr($phone, 1);
        }

        // 991234567 (9 chiffres) → 243991234567
        if (strlen($phone) === 9) {
            $phone = '243' . $phone;
        }

        // Déjà 243... mais trop long (ex. 2430991234567) → garder les 12 derniers
        if (str_starts_with($phone, '243') && strlen($phone) > 12) {
            $phone = substr($phone, 0, 12);
        }

        return $phone;
    }

    /**
     * Valide un numéro RDC (après formatPhoneRDC).
     * Vérifie : 243 + (8 ou 9) + 8 chiffres.
     */
    public static function isValidPhoneRDC(string $phone): bool
    {
        return (bool) preg_match('/^243(8|9)[0-9]{8}$/', $phone);
    }

    /**
     * Détecte l'opérateur Mobile Money (Vodacom, Airtel, Orange).
     * À appeler après formatPhoneRDC avec un numéro valide.
     *
     * @return string|null 'vodacom'|'airtel'|'orange' ou null si non reconnu
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
     * Retourne le numéro au format E.164 pour l'API Shwary (+243...).
     */
    public static function toE164(string $phone): string
    {
        $formatted = self::formatPhoneRDC($phone);
        if ($formatted === '') {
            return '';
        }
        return '+' . $formatted;
    }

    /**
     * Libellé opérateur pour affichage.
     */
    public static function operatorLabel(?string $operator): string
    {
        return match ($operator) {
            'vodacom' => 'Vodacom',
            'airtel'  => 'Airtel',
            'orange'  => 'Orange',
            default   => 'Inconnu',
        };
    }
}
