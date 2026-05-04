<?php

namespace App\Support;

/**
 * Messages destinés au client final : aucune marque du prestataire technique de paiement.
 */
final class ClientPaymentMessage
{
    /**
     * Retire ou remplace les noms commerciaux / URLs techniques pour les réponses JSON, toasts, etc.
     */
    public static function sanitize(string $text): string
    {
        $t = trim($text);
        if ($t === '') {
            return '';
        }

        $t = preg_replace('/\bFlexPay\b|\bFlexPaie\b|\bFlexpaie\b|\bFLEXPAY\b/ui', 'le service de paiement', $t);
        $t = preg_replace('/\bInfoset\b/ui', '', $t);
        $t = preg_replace('/https?:\/\/[^\s]*flexpay[^\s]*/iu', '', $t);
        $t = preg_replace('/https?:\/\/[^\s]*flexpaie[^\s]*/iu', '', $t);
        $t = preg_replace('/\s{2,}/u', ' ', $t);

        return trim($t, " \t\n\r\0\x0B,.;");
    }
}
