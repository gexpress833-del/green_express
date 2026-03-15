<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * Liste des factures du client connecté (pour la page "Mes factures").
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $invoices = Invoice::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Invoice $inv) {
                return [
                    'id' => $inv->id,
                    'amount' => (float) $inv->amount,
                    'currency' => $inv->currency,
                    'date' => $inv->created_at?->toIso8601String(),
                    'created_at' => $inv->created_at?->toIso8601String(),
                    'pdf_url' => $inv->pdf_url,
                    'order_id' => $inv->order_id,
                    'subscription_id' => $inv->subscription_id,
                ];
            });

        return response()->json($invoices);
    }
}
