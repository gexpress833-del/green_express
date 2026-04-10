<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Point;
use App\Models\Subscription;
use App\Models\User;
use App\Http\Traits\RoleAccess;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    use RoleAccess;

    /**
     * Statistiques tableau de bord client.
     * Utilise safeHasPermissionTo : hasPermissionTo() peut lever une exception si la ligne permission
     * n’existe pas en base (ex. seed oublié en prod → 500 au lieu de 403).
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $can = $user->safeHasPermissionTo('stats.client.view');
        if ($can === false) {
            return response()->json([
                'message' => 'Accès refusé. Statistiques client requises.',
                'current_role' => $user->role,
            ], 403);
        }
        // Permission absente du seeder : on autorise uniquement le rôle client (comportement historique)
        if ($can === null && $user->role !== 'client') {
            return response()->json([
                'message' => 'Accès refusé. Statistiques client requises.',
                'current_role' => $user->role,
            ], 403);
        }

        try {
            $userId = $user->canAsAdmin('stats.client.view')
                ? $request->input('user_id', $user->id)
                : $user->id;

            $ordersCount = Order::where('user_id', $userId)->count();
            $subscriptionsCount = Subscription::where('user_id', $userId)
                ->whereIn('status', [Subscription::STATUS_ACTIVE, Subscription::STATUS_SCHEDULED])
                ->count();
            $pointsBalance = Point::where('user_id', $userId)->value('balance') ?? 0;

            return response()->json([
                'orders' => $ordersCount,
                'subscriptions' => $subscriptionsCount,
                'points' => $pointsBalance,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne',
            ], 500);
        }
    }
}
