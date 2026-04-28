<?php

use App\Models\Company;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Flux temps réel des commandes — autorisé pour les rôles admin / secrétaire / cuisinier.
 */
Broadcast::channel('orders.admin', function ($user) {
    return in_array($user->role, ['admin', 'secretaire', 'cuisinier'], true)
        || $user->hasPermissionTo('orders.list');
});

/**
 * Flux temps réel des commandes — uniquement le client propriétaire.
 */
Broadcast::channel('orders.user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

/**
 * Flux temps réel des commandes — uniquement le livreur assigné.
 */
Broadcast::channel('orders.livreur.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId
        && ($user->role === 'livreur' || $user->hasPermissionTo('orders.view-assignments'));
});

/**
 * Flux temps réel des livraisons — admin / secrétaire / livreur.
 */
Broadcast::channel('deliveries.admin', function ($user) {
    return in_array($user->role, ['admin', 'secretaire', 'livreur'], true)
        || $user->hasPermissionTo('admin.deliveries')
        || $user->hasPermissionTo('orders.update-delivery-status');
});

/**
 * Flux temps réel des livraisons — entreprise propriétaire.
 */
Broadcast::channel('deliveries.company.{companyId}', function ($user, $companyId) {
    if ($user->role === 'admin' || $user->hasPermissionTo('admin.deliveries')) {
        return true;
    }

    return Company::query()
        ->whereKey($companyId)
        ->where('contact_user_id', $user->id)
        ->exists();
});

/**
 * Flux temps réel des abonnements B2B — admins / secrétariat.
 */
Broadcast::channel('subscriptions.admin', function ($user) {
    return in_array($user->role, ['admin', 'secretaire'], true)
        || $user->hasPermissionTo('admin.subscriptions');
});

/**
 * Flux temps réel des abonnements B2B — entreprise propriétaire.
 */
Broadcast::channel('subscriptions.company.{companyId}', function ($user, $companyId) {
    if ($user->role === 'admin' || $user->hasPermissionTo('admin.subscriptions')) {
        return true;
    }

    return Company::query()
        ->whereKey($companyId)
        ->where('contact_user_id', $user->id)
        ->exists();
});

/**
 * Flux temps réel des abonnements personnels — uniquement le client propriétaire.
 */
Broadcast::channel('subscriptions.user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

/**
 * Flux temps réel des paiements — admins / secrétariat.
 */
Broadcast::channel('payments.admin', function ($user) {
    return in_array($user->role, ['admin', 'secretaire'], true)
        || $user->hasPermissionTo('admin.payments');
});

/**
 * Flux temps réel des paiements — uniquement le client propriétaire.
 */
Broadcast::channel('payments.user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
