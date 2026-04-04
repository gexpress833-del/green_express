<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Point;
use App\Models\Subscription;
use App\Http\Traits\RoleAccess;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    use RoleAccess;

    public function stats(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            if (! $user->hasPermissionTo('stats.client.view')) {
                return response()->json([
                    'message' => 'Accès refusé. Statistiques client requises.',
                    'current_role' => $user->role,
                ], 403);
            }

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
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }
}
