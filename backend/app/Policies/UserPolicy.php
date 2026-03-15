<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    public function assignRole(User $actor, User $target)
    {
        return $actor->role === 'admin';
    }

    /**
     * Only administrators may create users and assign roles (livreur, cuisinier, etc. cannot).
     */
    public function create(User $actor)
    {
        return $actor->role === 'admin';
    }
}
