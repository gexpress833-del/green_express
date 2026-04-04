<?php

namespace App\Policies;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MenuPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Menu $menu): bool
    {
        if ($user->hasPermissionTo('menus.view')) {
            return true;
        }
        if ($user->hasPermissionTo('menus.view-own') && (int) $menu->created_by === (int) $user->id) {
            return true;
        }
        if ($user->hasPermissionTo('menus.view-approved')) {
            return $menu->status === 'approved';
        }

        return false;
    }

    public function update(User $user, Menu $menu): bool
    {
        if ($user->hasPermissionTo('menus.edit')) {
            return true;
        }

        return $user->hasPermissionTo('menus.edit-own')
            && (int) $menu->created_by === (int) $user->id;
    }

    public function delete(User $user, Menu $menu): bool
    {
        if ($user->hasPermissionTo('menus.delete')) {
            return true;
        }

        return $user->hasPermissionTo('menus.delete-own')
            && (int) $menu->created_by === (int) $user->id;
    }
}
