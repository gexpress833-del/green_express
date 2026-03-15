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
        if ($user->role === 'admin') {
            return true;
        }
        return (int) $menu->created_by === (int) $user->id;
    }

    public function update(User $user, Menu $menu): bool
    {
        if ($user->role === 'admin') {
            return true;
        }
        return (int) $menu->created_by === (int) $user->id;
    }

    public function delete(User $user, Menu $menu): bool
    {
        if ($user->role === 'admin') {
            return true;
        }
        return (int) $menu->created_by === (int) $user->id;
    }
}
