<?php

namespace App\Http\Traits;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

trait AdminRequiresPermission
{
    /**
     * Vérifie uniquement la permission Spatie (tout rôle : délégation secrétariat, etc.).
     */
    protected function requiresSpatiePermission(Request $request, string $permission): ?JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Non authentifié'], 401);
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
                'message' => 'Permission insuffisante.',
                'permission' => $permission,
            ], 403);
        }

        return null;
    }

    /**
     * Rôle administrateur **et** permission Spatie (routes réservées au back-office admin strict).
     */
    protected function adminRequires(Request $request, string $permission): ?JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès réservé aux administrateurs.'], 403);
        }

        return $this->requiresSpatiePermission($request, $permission);
    }
}
