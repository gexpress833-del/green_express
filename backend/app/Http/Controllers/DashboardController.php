<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Tableau de bord selon le rôle : retourne les infos adaptées (stats, résumé).
 * Route protégée auth:sanctum.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $role = $user->role ?? 'client';

        return response()->json([
            'user' => $user,
            'role' => $role,
            'dashboard_url' => '/' . $role,
            // Chaque rôle peut avoir son propre payload (stats, etc.) via les contrôleurs dédiés
            'message' => 'Utilisez les endpoints spécifiques (admin/stats, client/stats, etc.) pour les données détaillées.',
        ]);
    }
}
