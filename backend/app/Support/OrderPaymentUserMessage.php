<?php

namespace App\Support;

/**
 * Messages lisibles pour les échecs / états de paiement commande (API + admin).
 */
final class OrderPaymentUserMessage
{
    public static function humanizeFailureReason(?string $reason): string
    {
        $r = trim((string) $reason);
        if ($r === '') {
            return 'Le paiement Mobile Money n\'a pas abouti. Aucun montant n\'a été débité.';
        }

        $lower = mb_strtolower($r);

        if (preg_match('/^(echec|échec)\s+(flexpay|flexpaie|paiement)?\s*$/u', $lower)
            || preg_match('/^(failed|payment\s*failed)$/u', $lower)
            || $lower === 'flexpay'
            || $lower === 'flexpaie'
        ) {
            return 'Le paiement Mobile Money a été refusé. Vérifiez votre solde, votre opérateur ou réessayez.';
        }

        if (preg_match('/insufficient|insuffisant|solde/iu', $r)) {
            return 'Solde Mobile Money insuffisant. Rechargez votre compte ou utilisez un autre numéro, puis réessayez.';
        }
        if (preg_match('/timeout|timed?\s*out|expir|d.lai/iu', $r)) {
            return 'Aucune confirmation reçue à temps sur votre téléphone (USSD). Réessayez et validez le code dans la minute.';
        }
        if (preg_match('/cancel|refus|denied|reject/iu', $r)) {
            return 'Paiement refusé par votre opérateur Mobile Money ou annulé sur le téléphone. Réessayez si nécessaire.';
        }
        if (preg_match('/destination number|number you have entered is invalid/iu', $r)) {
            return 'Numéro Mobile Money invalide pour votre opérateur. Vérifiez le numéro saisi.';
        }

        return ClientPaymentMessage::sanitize($r);
    }
}
