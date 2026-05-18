<?php

namespace App\Services\Auth;

use App\Models\User;

/**
 * Prépare le tableau utilisateur + permissions Spatie (même forme que l’API historique).
 * Utilisable par l’API JSON, Livewire, ou futures vues Blade.
 */
class UserPermissionPresenter
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(User $user): array
    {
        $base = $user->toArray();
        $perms = $user->getAllPermissions()->pluck('name')->values()->all();
        if ($perms === [] && $user->role) {
            $fromConfig = config('roles.roles.'.$user->role.'.permissions');
            if (is_array($fromConfig) && $fromConfig !== []) {
                $perms = $fromConfig;
            }
        }
        $base['permissions'] = $perms;

        return $base;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function toNullableArray(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return $this->toArray($user);
    }
}
