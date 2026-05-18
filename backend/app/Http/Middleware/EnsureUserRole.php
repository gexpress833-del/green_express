<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restreint une route web aux rôles applicatifs listés (colonne users.role).
 */
class EnsureUserRole
{
    /**
     * @param  string  ...$roles  Ex. middleware('ensure.role:client') ou ensure.role:client,admin
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (! $user || ! in_array($user->role, $roles, true)) {
            abort(Response::HTTP_FORBIDDEN, 'Accès non autorisé pour ce type de compte.');
        }

        return $next($request);
    }
}
