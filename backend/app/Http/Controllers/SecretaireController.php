<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

/**
 * Tableau de bord secrétariat : indicateurs globaux (sans accès aux réglages admin sensibles).
 */
class SecretaireController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        if (! $user || $user->role !== 'secretaire') {
            return response()->json(['message' => 'Accès réservé au secrétariat'], 403);
        }

        return response()->json([
            'orders_today' => Order::whereDate('created_at', today())->count(),
            'pending_payment' => Order::where('status', 'pending_payment')->count(),
            'awaiting_driver' => Order::query()
                ->whereIn('status', ['pending', 'paid', 'out_for_delivery'])
                ->whereNotNull('delivery_code')
                ->whereNull('livreur_id')
                ->count(),
            'out_for_delivery' => Order::where('status', 'out_for_delivery')->count(),
            'delivered_today' => Order::where('status', 'delivered')->whereDate('updated_at', today())->count(),
        ]);
    }
}
