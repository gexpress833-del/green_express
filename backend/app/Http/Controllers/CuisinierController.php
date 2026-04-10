<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Http\Traits\RoleAccess;
use Illuminate\Http\Request;

class CuisinierController extends Controller
{
    use RoleAccess;

    public function stats(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            if (! $user->hasPermissionTo('stats.cuisinier.view')) {
                return response()->json([
                    'message' => 'Accès refusé. Statistiques cuisine requises.',
                    'current_role' => $user->role,
                ], 403);
            }

            $query = Menu::query();
            if ($user->hasPermissionTo('menus.list-own') && ! $user->hasPermissionTo('menus.list')) {
                $query->where('created_by', $user->id);
            }

            $menusCount = (clone $query)->count();
            $submitted = (clone $query)->where('status', 'pending')->count();
            $validated = (clone $query)->where('status', 'approved')->count();

            return response()->json([
                'menus' => $menusCount,
                'submitted' => $submitted,
                'validated' => $validated,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }
}
