<?php

namespace App\Http\Traits;

use Illuminate\Http\Request;

/**
 * Trait pour vérifier les rôles et permissions des utilisateurs.
 * Fournit des méthodes pour contrôler l'accès basé sur le rôle.
 */
trait RoleAccess
{
    /**
     * Vérifie si l'utilisateur a un rôle spécifique (avec paramètre optionnel Request).
     * Retourne 403 si non autorisé.
     */
    protected function requireRole($requestOrRole, $rolesIfTwoParams = null)
    {
        // Support deux signatures:
        // requireRole('admin') - utilise $this->request
        // requireRole($request, ['admin', 'super']) - utilise le paramètre Request
        
        if ($requestOrRole instanceof Request) {
            $request = $requestOrRole;
            $roles = $rolesIfTwoParams;
        } else {
            // Supposons que c'est un rôle et qu'on a $this->request disponible
            $request = request();
            $roles = $requestOrRole;
        }
        
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $rolesArray = is_array($roles) ? $roles : [$roles];
        
        if (!in_array($user->role, $rolesArray)) {
            return response()->json([
                'message' => 'Accès refusé. Rôle requis : ' . implode(', ', $rolesArray),
                'current_role' => $user->role
            ], 403);
        }

        return null; // Pas d'erreur
    }

    /**
     * Vérifie si l'utilisateur a une permission spécifique.
     * Retourne 403 si non autorisé.
     */
    protected function requirePermission(Request $request, string $permission)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $config = config('roles.roles');
        $userRole = $config[$user->role] ?? null;

        if (!$userRole || !in_array($permission, $userRole['permissions'] ?? [])) {
            return response()->json([
                'message' => 'Vous n\'avez pas la permission : ' . $permission,
                'current_role' => $user->role
            ], 403);
        }

        return null; // Pas d'erreur
    }

    /**
     * Vérifie si l'utilisateur est propriétaire de la ressource ou admin.
     * Retourne 403 si non autorisé.
     */
    protected function requireOwnerOrAdmin(Request $request, int $ownerId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if ($user->id !== $ownerId && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Vous n\'êtes pas autorisé à accéder cette ressource'
            ], 403);
        }

        return null; // Pas d'erreur
    }

    /**
     * Retourne les permissions de l'utilisateur.
     */
    protected function getUserPermissions(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return [];
        }

        $config = config('roles.roles');
        return $config[$user->role]['permissions'] ?? [];
    }

    /**
     * Retourne les informations du rôle.
     */
    protected function getRoleInfo(string $role)
    {
        return config('roles.roles')[$role] ?? null;
    }

    /**
     * Vérifie si l'utilisateur connecté a l'un des rôles donnés.
     */
    protected function hasRole(string ...$roles): bool
    {
        $user = request()->user();
        return $user && in_array($user->role, $roles, true);
    }
}
