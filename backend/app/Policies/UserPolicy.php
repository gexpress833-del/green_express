<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    public function assignRole(User $actor, User $target)
    {
        return $actor->hasPermissionTo('users.assign-role');
    }

    /**
     * Only administrators may create users and assign roles (livreur, cuisinier, etc. cannot).
     */
    public function create(User $actor)
    {
        return $actor->hasPermissionTo('users.create');
    }
}
