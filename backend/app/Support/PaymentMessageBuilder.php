<?php

namespace App\Support;

use App\Models\Payment;

class PaymentMessageBuilder
{
    /**
     * Construit un message client clair à partir du contexte paiement + retour webhook.
     *
     * @param  array{success: bool, failure: bool, message: string}  $parsed
     */
    public static function forClient(Payment $payment, array $parsed): string
    {
        if (! empty($parsed['success'])) {
            return self::successMessage($payment);
        }

        if (! empty($parsed['failure'])) {
            return self::failureMessage($payment, (string) ($parsed['message'] ?? ''));
        }

        return self::pendingMessage($payment);
    }

    /**
     * Catégorise le retour webhook : succeeded | failed | pending.
     *
     * @param  array{success: bool, failure: bool}  $parsed
     */
    public static function eventName(array $parsed): string
    {
        if (! empty($parsed['success'])) {
            return 'succeeded';
        }
        if (! empty($parsed['failure'])) {
            return 'failed';
        }

        return 'pending';
    }

    private static function successMessage(Payment $payment): string
    {
        if ($payment->order_id) {
            return 'Paiement reçu : votre commande est confirmée et un code de livraison vous a été attribué.';
        }
        if ($payment->subscription_id) {
            return 'Paiement reçu : votre abonnement est programmé.';
        }
        if ($payment->company_subscription_id) {
            return 'Paiement reçu : abonnement entreprise activé.';
        }

        return 'Paiement reçu avec succès.';
    }

    private static function failureMessage(Payment $payment, string $rawMessage): string
    {
        $raw = mb_strtolower(trim($rawMessage));

        $patterns = [
            ['insufficient', 'solde', 'fund'],
            'Paiement échoué : solde Mobile Money insuffisant. Rechargez puis réessayez.',
        ];

        $rules = [
            'Paiement échoué : solde Mobile Money insuffisant. Rechargez puis réessayez.' =>
                ['insufficient', 'solde', 'fund', 'balance'],
            'Paiement annulé : vous avez refusé la transaction sur votre téléphone.' =>
                ['cancel', 'refus', 'rejected by user', 'declined by user'],
            'Paiement expiré : la confirmation USSD n’a pas été reçue à temps. Veuillez réessayer.' =>
                ['timeout', 'expired', 'time out'],
            'Paiement échoué : code PIN Mobile Money invalide.' =>
                ['invalid pin', 'wrong pin', 'mauvais pin'],
            'Paiement échoué : limite de transaction atteinte sur votre opérateur.' =>
                ['limit reached', 'transaction limit', 'plafond'],
            'Paiement échoué : numéro Mobile Money non enregistré ou inactif.' =>
                ['not registered', 'not active', 'unknown subscriber', 'invalid msisdn'],
            'Paiement échoué : opérateur Mobile Money temporairement indisponible. Réessayez dans quelques minutes.' =>
                ['unavailable', 'service indisponible', 'operator down', 'maintenance'],
            'Paiement refusé par votre banque ou votre carte.' =>
                ['declined', 'do not honor', 'card declined', 'card refused'],
        ];

        foreach ($rules as $message => $needles) {
            foreach ($needles as $needle) {
                if ($raw !== '' && str_contains($raw, $needle)) {
                    return $message;
                }
            }
        }

        $detail = $rawMessage !== '' ? $rawMessage : 'opérateur Mobile Money indisponible';

        return 'Paiement échoué : '.$detail.'. Veuillez réessayer.';
    }

    private static function pendingMessage(Payment $payment): string
    {
        if ($payment->order_id) {
            return 'Paiement en cours : confirmez la transaction sur votre téléphone (USSD).';
        }
        if ($payment->subscription_id || $payment->company_subscription_id) {
            return 'Paiement en cours : votre abonnement sera activé dès la confirmation.';
        }

        return 'Paiement en cours de traitement…';
    }
}
