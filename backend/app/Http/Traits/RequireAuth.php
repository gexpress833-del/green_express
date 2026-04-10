<?php

namespace App\Http\Traits;

use Illuminate\Http\Request;

trait RequireAuth
{
    /**
     * Ensure the request has an authenticated user.
     * Returns a 401 JSON response if not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\User|null User if authenticated
     */
    protected function requireAuth(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return $user;
    }

    /**
     * Ensure the user has the required role, otherwise return 403.
     *
     * @param  mixed  $user
     * @param  array|string  $roles
     * @return boolean|void
     */
    protected function checkUserRole($user, $roles)
    {
        $roles = is_array($roles) ? $roles : [$roles];
        if (! in_array($user->role, $roles)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return true;
    }
}
