<?php

namespace App\Support;

use Illuminate\Support\Collection;

class PermissionCatalog
{
    /**
     * Toutes les permissions connues (rôles + libellés), pour seed et UI.
     */
    public static function allPermissionNames(): Collection
    {
        $fromRoles = collect(config('roles.roles', []))
            ->pluck('permissions')
            ->flatten()
            ->filter();

        $fromLabels = collect(config('permission_labels.groups', []))
            ->flatMap(fn (array $items) => array_keys($items));

        return $fromRoles
            ->merge($fromLabels)
            ->unique()
            ->sort()
            ->values();
    }

    /**
     * Registre groupé pour l’interface d’administration (libellés).
     */
    public static function groupedForRegistry(): array
    {
        $groups = config('permission_labels.groups', []);
        $out = [];
        foreach ($groups as $groupName => $items) {
            $perms = [];
            foreach ($items as $name => $label) {
                $perms[] = ['name' => $name, 'label' => $label];
            }
            $out[] = [
                'id' => $groupName,
                'label' => $groupName,
                'permissions' => $perms,
            ];
        }

        return $out;
    }
}
