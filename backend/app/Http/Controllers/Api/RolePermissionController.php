<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\AdminRequiresPermission;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionController extends Controller
{
    use AdminRequiresPermission;

    private const EDITABLE_ROLES = [
        'client',
        'cuisinier',
        'livreur',
        'entreprise',
        'verificateur',
        'secretaire',
        'agent',
    ];

    /**
     * Registre des permissions (groupes + libellés) pour l’interface.
     */
    public function registry(Request $request): JsonResponse
    {
        if ($r = $this->adminRequires($request, 'roles.manage_permissions')) {
            return $r;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'groups' => PermissionCatalog::groupedForRegistry(),
                'editable_roles' => self::EDITABLE_ROLES,
                'admin_role_readonly' => true,
            ],
        ]);
    }

    public function show(Request $request, string $role): JsonResponse
    {
        if ($r = $this->adminRequires($request, 'roles.manage_permissions')) {
            return $r;
        }

        $roleModel = Role::where('name', $role)->where('guard_name', 'web')->first();
        if (! $roleModel) {
            return response()->json(['success' => false, 'message' => 'Rôle inconnu'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'role' => $roleModel->name,
                'permissions' => $roleModel->permissions->pluck('name')->values()->all(),
                'readonly' => $role === 'admin',
            ],
        ]);
    }

    public function update(Request $request, string $role): JsonResponse
    {
        if ($r = $this->adminRequires($request, 'roles.manage_permissions')) {
            return $r;
        }

        if ($role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Le rôle administrateur conserve l’ensemble des permissions système ; il n’est pas modifiable depuis cette interface.',
            ], 422);
        }

        if (! in_array($role, self::EDITABLE_ROLES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Ce rôle ne peut pas être modifié depuis cet écran.',
            ], 422);
        }

        $allowed = PermissionCatalog::allPermissionNames()->all();
        $validated = $request->validate([
            'permissions' => 'present|array',
            'permissions.*' => ['string', Rule::in($allowed)],
        ]);

        $roleModel = Role::where('name', $role)->where('guard_name', 'web')->first();
        if (! $roleModel) {
            return response()->json(['success' => false, 'message' => 'Rôle inconnu'], 404);
        }

        $roleModel->syncPermissions($validated['permissions']);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'success' => true,
            'message' => 'Permissions du rôle mises à jour.',
            'data' => [
                'role' => $roleModel->name,
                'permissions' => $roleModel->permissions->pluck('name')->values()->all(),
            ],
        ]);
    }
}
