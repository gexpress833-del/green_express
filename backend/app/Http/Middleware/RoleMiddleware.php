<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (empty($roles) || in_array($user->role, $roles)) {
            return $next($request);
        }

        return response()->json(['message' => 'Forbidden'], 403);
    }
}
