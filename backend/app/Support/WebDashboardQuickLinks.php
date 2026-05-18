<?php

namespace App\Support;

use Illuminate\Support\Facades\Route;

/**
 * Liens d’accès rapide sur le dashboard Blade (migration progressive).
 * Les entrées marquées « soon » pointeront vers de futures routes Livewire.
 */
final class WebDashboardQuickLinks
{
    /**
     * @return list<array{label: string, href: string, soon?: bool, external?: bool}>
     */
    public static function forRole(?string $role): array
    {
        return match ($role) {
            'admin' => [
                ['label' => 'Administration Filament', 'href' => url('/admin'), 'external' => true],
                ['label' => 'Vue d’ensemble (Livewire)', 'href' => '#', 'soon' => true],
                ['label' => 'Commandes', 'href' => '#', 'soon' => true],
                ['label' => 'Paiements', 'href' => '#', 'soon' => true],
            ],
            'client' => [
                ['label' => 'Menus & commander', 'href' => Route::has('client.menus') ? route('client.menus') : '#'],
                ['label' => 'Mon panier', 'href' => Route::has('client.cart') ? route('client.cart') : '#'],
                ['label' => 'Mes commandes', 'href' => Route::has('client.orders.index') ? route('client.orders.index') : '#'],
                ['label' => 'Espace client', 'href' => Route::has('client.home') ? route('client.home') : '#'],
                ['label' => 'Abonnements', 'href' => '#', 'soon' => true],
            ],
            'entreprise' => [
                ['label' => 'Tableau entreprise', 'href' => '#', 'soon' => true],
                ['label' => 'Abonnements entreprise', 'href' => '#', 'soon' => true],
                ['label' => 'Employés', 'href' => '#', 'soon' => true],
            ],
            'livreur' => [
                ['label' => 'Livraisons', 'href' => '#', 'soon' => true],
                ['label' => 'Performance', 'href' => '#', 'soon' => true],
            ],
            'cuisinier' => [
                ['label' => 'Commandes cuisine', 'href' => '#', 'soon' => true],
                ['label' => 'Menus', 'href' => '#', 'soon' => true],
            ],
            'verificateur' => [
                ['label' => 'Vérifications', 'href' => '#', 'soon' => true],
            ],
            'secretaire' => [
                ['label' => 'Demandes & flux', 'href' => '#', 'soon' => true],
            ],
            'agent' => [
                ['label' => 'Espace agent', 'href' => '#', 'soon' => true],
            ],
            default => [
                ['label' => 'Accès général', 'href' => '#', 'soon' => true],
            ],
        };
    }
}
