<?php

namespace App\Support;

/**
 * Libellés et styles d’affichage des statuts de commande (côté client Blade).
 */
final class OrderStatusPresenter
{
    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return ['pending_payment', 'pending', 'paid', 'out_for_delivery', 'delivered', 'cancelled'];
    }

    public static function label(?string $status): string
    {
        return match ((string) $status) {
            'pending_payment' => 'Paiement en attente',
            'pending' => 'En préparation',
            'paid' => 'Payée',
            'out_for_delivery' => 'En livraison',
            'delivered' => 'Livrée',
            'cancelled' => 'Annulée',
            default => ($status !== null && $status !== '') ? (string) $status : '—',
        };
    }

    /**
     * @return array<string, string>
     */
    public static function filterOptions(): array
    {
        $out = ['' => 'Toutes les commandes'];
        foreach (self::values() as $value) {
            $out[$value] = self::label($value);
        }

        return $out;
    }

    public static function badgeClasses(?string $status): string
    {
        return match ((string) $status) {
            'pending_payment' => 'bg-amber-100 text-amber-900 ring-1 ring-amber-600/15',
            'pending' => 'bg-sky-100 text-sky-900 ring-1 ring-sky-600/15',
            'paid' => 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-600/15',
            'out_for_delivery' => 'bg-violet-100 text-violet-900 ring-1 ring-violet-600/15',
            'delivered' => 'bg-zinc-200 text-zinc-800 ring-1 ring-zinc-400/25',
            'cancelled' => 'bg-red-100 text-red-900 ring-1 ring-red-600/15',
            default => 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-400/20',
        };
    }
}
