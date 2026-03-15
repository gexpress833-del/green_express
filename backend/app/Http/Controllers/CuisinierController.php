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

            // Seuls les cuisiniers et admins peuvent voir ces stats
            if ($user->role !== 'cuisinier' && $user->role !== 'admin') {
                return response()->json([
                    'message' => 'Accès refusé. Rôle cuisinier ou admin requis',
                    'current_role' => $user->role
                ], 403);
            }

            // Les cuisiniers ne voient que leurs propres stats, les admins voient tout
            $query = Menu::query();
            if ($user->role === 'cuisinier') {
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
