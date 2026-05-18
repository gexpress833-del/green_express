<?php

namespace App\Support;

/**
 * Libellés des statuts de la table `payments` (FlexPay, manuel, etc.).
 */
final class PaymentStatusPresenter
{
    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return ['pending', 'completed', 'failed', 'cancelled'];
    }

    public static function label(?string $status): string
    {
        return match ((string) $status) {
            'pending' => 'En attente',
            'completed' => 'Complété',
            'failed' => 'Échoué',
            'cancelled' => 'Annulé',
            default => ($status !== null && $status !== '') ? (string) $status : '—',
        };
    }

    public static function badgeClasses(?string $status): string
    {
        return match ((string) $status) {
            'pending' => 'bg-amber-100 text-amber-900 ring-1 ring-amber-600/15',
            'completed' => 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-600/15',
            'failed' => 'bg-red-100 text-red-900 ring-1 ring-red-600/15',
            'cancelled' => 'bg-zinc-200 text-zinc-800 ring-1 ring-zinc-400/25',
            default => 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-400/20',
        };
    }
}
