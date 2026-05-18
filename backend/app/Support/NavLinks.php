<?php

namespace App\Support;

use Illuminate\Support\Facades\Route;

/**
 * Liens de navigation par rôle pour la sidebar Blade.
 * Les entrées marquées "soon" n'ont pas encore de route Livewire.
 */
final class NavLinks
{
    /**
     * @return list<array{href: string, label: string, icon?: string, soon?: bool}>
     */
    public static function forRole(?string $role): array
    {
        return match ($role) {
            'admin'      => self::adminLinks(),
            'cuisinier'  => self::cuisinierLinks(),
            'client'     => self::clientLinks(),
            'livreur'    => self::livreurLinks(),
            'entreprise' => self::entrepriseLinks(),
            'verificateur' => self::verificateurLinks(),
            'secretaire' => self::secretaireLinks(),
            'agent'      => self::agentLinks(),
            default      => [],
        };
    }

    private static function adminLinks(): array
    {
        return [
            ['href' => route('dashboard'),              'label' => 'Tableau de bord',         'icon' => 'home'],
            ['href' => route('admin.blade.resource', 'menus'), 'label' => 'Menus',             'icon' => 'menu',        'soon' => false],
            ['href' => '#',                              'label' => 'Promotions',              'icon' => 'tag',         'soon' => true],
            ['href' => route('admin.blade.resource', 'users'), 'label' => 'Utilisateurs',      'icon' => 'users',       'soon' => false],
            ['href' => route('admin.blade.resource', 'orders'), 'label' => 'Commandes',        'icon' => 'shopping-bag', 'soon' => false],
            ['href' => route('admin.blade.resource', 'companies'), 'label' => 'Entreprises',   'icon' => 'building',    'soon' => false],
            ['href' => route('admin.blade.resource', 'subscriptions'), 'label' => 'Abonnements', 'icon' => 'calendar',  'soon' => false],
            ['href' => route('admin.blade.resource', 'company-subscriptions'), 'label' => 'Abonnements B2B', 'icon' => 'calendar-days', 'soon' => false],
            ['href' => '#',                              'label' => 'Plans abonnements',       'icon' => 'list',        'soon' => true],
            ['href' => route('admin.blade.resource', 'payments'), 'label' => 'Paiements',      'icon' => 'credit-card', 'soon' => false],
            ['href' => route('admin.blade.resource', 'deliveries'), 'label' => 'Livraisons',   'icon' => 'truck',       'soon' => false],
            ['href' => '#',                              'label' => 'Suivi commandes',         'icon' => 'map',         'soon' => true],
            ['href' => '#',                              'label' => 'Statistiques',            'icon' => 'chart',       'soon' => true],
            ['href' => '#',                              'label' => 'Rôles & permissions',     'icon' => 'shield',      'soon' => true],
            ['href' => route('admin.blade.resource', 'reports'), 'label' => 'Rapports',        'icon' => 'document',    'soon' => false],
            ['href' => '#',                              'label' => 'Demandes événements',       'icon' => 'flag',        'soon' => true],
            ['href' => '#',                              'label' => 'Types d\'événements',       'icon' => 'flag',        'soon' => true],
            ['href' => url('/admin'),                   'label' => 'Administration Filament', 'icon' => 'shield',      'soon' => false],
            ['href' => '#',                              'label' => 'Centre notifications',    'icon' => 'bell',        'soon' => true],
            ['href' => '#',                              'label' => 'Diffusion annonces',      'icon' => 'speaker',     'soon' => true],
            ['href' => route('profile'),                'label' => 'Mon profil',              'icon' => 'user',        'soon' => false],
            ['href' => route('logout'),                  'label' => 'Déconnexion',             'icon' => 'logout',      'soon' => false],
        ];
    }

    private static function cuisinierLinks(): array
    {
        return [
            ['href' => route('dashboard'),      'label' => 'Tableau de bord',         'icon' => 'home'],
            ['href' => '#',                      'label' => 'Menus',                   'icon' => 'menu',        'soon' => true],
            ['href' => '#',                      'label' => 'Abonnements & repas',     'icon' => 'calendar',    'soon' => true],
            ['href' => '#',                      'label' => 'Commandes / livreurs',    'icon' => 'shopping-bag', 'soon' => true],
            ['href' => '#',                      'label' => 'Notifications',           'icon' => 'bell',        'soon' => true],
            ['href' => '#',                      'label' => 'Mon profil',              'icon' => 'user',        'soon' => true],
            ['href' => route('logout'),          'label' => 'Déconnexion',             'icon' => 'logout',      'soon' => false],
        ];
    }

    private static function clientLinks(): array
    {
        return [
            ['href' => route('client.menus'),         'label' => 'Menus & commander', 'icon' => 'menu'],
            ['href' => route('client.cart'),          'label' => 'Mon panier',        'icon' => 'cart'],
            ['href' => route('client.orders.index'), 'label' => 'Mes commandes',     'icon' => 'shopping-bag'],
            ['href' => route('client.home'),          'label' => 'Espace client',     'icon' => 'home'],
            ['href' => route('dashboard'),           'label' => 'Tableau de bord',   'icon' => 'layout'],
            ['href' => route('profile'),             'label' => 'Mon profil',        'icon' => 'user'],
            ['href' => '#',                          'label' => 'Abonnements',       'icon' => 'calendar', 'soon' => true],
            ['href' => '#',                          'label' => 'Notifications',     'icon' => 'bell',     'soon' => true],
            ['href' => route('logout'),              'label' => 'Déconnexion',       'icon' => 'logout',   'soon' => false],
        ];
    }

    private static function livreurLinks(): array
    {
        return [
            ['href' => route('dashboard'),      'label' => 'Livraisons',     'icon' => 'truck'],
            ['href' => '#',                      'label' => 'Performance',    'icon' => 'chart',  'soon' => true],
            ['href' => '#',                      'label' => 'Notifications',  'icon' => 'bell',   'soon' => true],
            ['href' => '#',                      'label' => 'Mon profil',     'icon' => 'user',   'soon' => true],
            ['href' => route('logout'),          'label' => 'Déconnexion',    'icon' => 'logout', 'soon' => false],
        ];
    }

    private static function entrepriseLinks(): array
    {
        return [
            ['href' => route('dashboard'),      'label' => 'Tableau entreprise',   'icon' => 'home',        'soon' => true],
            ['href' => '#',                      'label' => 'Employés',           'icon' => 'users',       'soon' => true],
            ['href' => '#',                      'label' => 'Abonnements',        'icon' => 'calendar',    'soon' => true],
            ['href' => '#',                      'label' => 'Budget',             'icon' => 'credit-card', 'soon' => true],
            ['href' => '#',                      'label' => 'Notifications',      'icon' => 'bell',        'soon' => true],
            ['href' => '#',                      'label' => 'Mon profil',         'icon' => 'user',        'soon' => true],
            ['href' => route('logout'),          'label' => 'Déconnexion',        'icon' => 'logout',      'soon' => false],
        ];
    }

    private static function verificateurLinks(): array
    {
        return [
            ['href' => route('dashboard'),      'label' => 'Vérifications',  'icon' => 'shield', 'soon' => true],
            ['href' => '#',                      'label' => 'Notifications',  'icon' => 'bell',   'soon' => true],
            ['href' => '#',                      'label' => 'Mon profil',     'icon' => 'user',   'soon' => true],
            ['href' => route('logout'),          'label' => 'Déconnexion',    'icon' => 'logout', 'soon' => false],
        ];
    }

    private static function secretaireLinks(): array
    {
        return [
            ['href' => route('dashboard'),      'label' => 'Demandes & flux',  'icon' => 'inbox',  'soon' => true],
            ['href' => '#',                      'label' => 'Notifications',    'icon' => 'bell',   'soon' => true],
            ['href' => '#',                      'label' => 'Mon profil',       'icon' => 'user',   'soon' => true],
            ['href' => route('logout'),          'label' => 'Déconnexion',      'icon' => 'logout', 'soon' => false],
        ];
    }

    private static function agentLinks(): array
    {
        return [
            ['href' => route('dashboard'),      'label' => 'Espace agent',   'icon' => 'briefcase', 'soon' => true],
            ['href' => '#',                      'label' => 'Notifications',  'icon' => 'bell',      'soon' => true],
            ['href' => '#',                      'label' => 'Mon profil',     'icon' => 'user',      'soon' => true],
            ['href' => route('logout'),          'label' => 'Déconnexion',    'icon' => 'logout',    'soon' => false],
        ];
    }
}
