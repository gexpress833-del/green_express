<?php

namespace App\Http\Traits;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

trait AdminRequiresPermission
{
    /**
     * Réserve l’action aux comptes avec rôle admin ayant la permission Spatie demandée.
     * Évite une exception Spatie si la permission n’existe pas encore en base (seed manquant).
     */
    protected function adminRequires(Request $request, string $permission): ?JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $perm = Permission::query()
            ->where('name', $permission)
            ->where('guard_name', 'web')
            ->first();

        if (! $perm) {
            return response()->json([
                'message' => 'Permission système manquante. Exécutez : php artisan db:seed --class=RolesAndPermissionsSeeder',
                'permission' => $permission,
            ], 503);
        }

        if (! $user->hasPermissionTo($perm)) {
            return response()->json([
                'message' => 'Votre compte administrateur n’a pas la permission requise.',
                'permission' => $permission,
            ], 403);
        }

        return null;
    }
}
