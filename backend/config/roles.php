<?php

/**
 * Configuration des rôles et permissions du système.
 * Définit les permissions par rôle pour le contrôle d'accès.
 */

return [
    'roles' => [
        'admin' => [
            'label' => 'Administrateur',
            'description' => 'Accès complet au système',
            'permissions' => [
                // User Management
                'users.create',
                'users.edit',
                'users.delete',
                'users.assign-role',
                'users.list',
                
                // Menus
                'menus.create',
                'menus.edit',
                'menus.delete',
                'menus.view',
                'menus.approve',
                'menus.reject',
                'menus.list',
                
                // Orders
                'orders.create',
                'orders.edit',
                'orders.delete',
                'orders.view',
                'orders.list',
                'orders.cancel',
                
                // Promotions
                'promotions.create',
                'promotions.edit',
                'promotions.delete',
                'promotions.view',
                'promotions.claim',
                'promotions.list',
                
                // Statistics
                'stats.admin.view',
                'stats.client.view',
                'stats.cuisinier.view',
                'stats.livreur.view',
                'stats.verificateur.view',
                'stats.entreprise.view',
                
                // Subscriptions
                'subscriptions.create',
                'subscriptions.edit',
                'subscriptions.delete',
                'subscriptions.list',
            ]
        ],
        
        'cuisinier' => [
            'label' => 'Cuisinier',
            'description' => 'Gère ses menus et consulte les commandes',
            'permissions' => [
                // Menus (uniquement ses propres menus)
                'menus.create',
                'menus.edit-own',
                'menus.delete-own',
                'menus.view-own',
                'menus.list-own',
                
                // Orders (peut voir les commandes de ses menus)
                'orders.view-own-menus',
                'orders.list-own-menus',
                
                // Statistics
                'stats.cuisinier.view',
            ]
        ],
        
        'client' => [
            'label' => 'Client',
            'description' => 'Peut commander, voir les promotions et gérer son compte',
            'permissions' => [
                // Menus (peut voir les menus approuvés)
                'menus.view-approved',
                'menus.list-approved',
                
                // Orders (peut créer et voir ses propres commandes)
                'orders.create',
                'orders.view-own',
                'orders.list-own',
                'orders.cancel-own',
                
                // Promotions (peut voir et réclamer les promotions)
                'promotions.view',
                'promotions.claim',
                'promotions.list',
                
                // Subscriptions (peut gérer ses abonnements)
                'subscriptions.create',
                'subscriptions.cancel-own',
                'subscriptions.view-own',
                
                // Statistics
                'stats.client.view',
            ]
        ],
        
        'livreur' => [
            'label' => 'Livreur',
            'description' => 'Gère les livraisons assignées',
            'permissions' => [
                // Orders (peut voir les commandes à livrer)
                'orders.view-assignments',
                'orders.list-assignments',
                'orders.update-delivery-status',
                'orders.validate-delivery-code',
                
                // Statistics
                'stats.livreur.view',
            ]
        ],
        
        'verificateur' => [
            'label' => 'Vérificateur',
            'description' => 'Valide les tickets de promotion',
            'permissions' => [
                // Promotions (peut valider les tickets)
                'promotions.validate-ticket',
                'promotions.view',
                'promotions.list',
                
                // Statistics
                'stats.verificateur.view',
            ]
        ],
        
        'entreprise' => [
            'label' => 'Chef d\'entreprise',
            'description' => 'Gère ses employés et les budgets',
            'permissions' => [
                // User Management (peut gérer ses employés uniquement)
                'users.view-own',
                'users.list-own',
                
                // Orders (peut voir les commandes de l\'entreprise)
                'orders.view-own',
                'orders.list-own',
                
                // Subscriptions (peut créer et gérer pour l\'entreprise)
                'subscriptions.create',
                'subscriptions.view-own',
                'subscriptions.list-own',
                
                // Statistics
                'stats.entreprise.view',
            ]
        ],
    ],

    /**
     * Endpoints publics (accessible sans authentification)
     */
    'public_endpoints' => [
        'auth.register',
        'auth.login',
        'menus.browse',
        'promotions.public',
    ],

    /**
     * Endpoints protégés avec vérification de rôle
     */
    'protected_endpoints' => [
        'users' => ['admin'],
        'menus.own' => ['cuisinier', 'admin'],
        'admin.stats' => ['admin'],
        'client.stats' => ['client'],
        'cuisinier.stats' => ['cuisinier'],
        'livreur.stats' => ['livreur'],
        'verificateur.stats' => ['verificateur'],
        'entreprise.stats' => ['entreprise'],
    ],
];
