<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Admin : liste des paiements (id, user, amount, phone, status, created_at) avec filtres.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $query = Payment::query()
            ->with([
                'order:id,uuid,user_id,status',
                'order.user:id,name,email',
                'subscription:id,uuid,user_id,plan,status',
                'subscription.user:id,name,email',
            ])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        $perPage = (int) $request->get('per_page', 20);
        $perPage = min(max($perPage, 5), 100);
        $payments = $query->paginate($perPage);

        return response()->json($payments);
    }

    /**
     * Admin : statistiques paiements (total, success, failed, pending, revenue).
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $base = Payment::query();
        $total = (clone $base)->count();
        $totalSuccess = (clone $base)->whereIn('status', ['completed', 'paid'])->count();
        $totalFailed = (clone $base)->where('status', 'failed')->count();
        $totalPending = (clone $base)->where('status', 'pending')->count();
        $revenue = (clone $base)->whereIn('status', ['completed', 'paid'])->sum('amount');

        return response()->json([
            'total' => $total,
            'total_success' => $totalSuccess,
            'total_failed' => $totalFailed,
            'total_pending' => $totalPending,
            'revenue' => round((float) $revenue, 2),
        ]);
    }

    /**
     * Admin : déclencher une réconciliation (placeholder — à brancher sur API provider si besoin).
     */
    public function reconcile(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        Log::info('Admin triggered payment reconciliation', ['user_id' => $user->id]);
        return response()->json([
            'message' => 'Réconciliation déclenchée. Les paiements affichés proviennent de la base locale. Pour synchroniser avec un provider (ex. Shwary), configurez le webhook et les jobs.',
        ]);
    }

    /**
     * Webhook paiement générique (public).
     * Pour Shwary, utiliser POST /api/shwary/callback qui gère signature + mise à jour Payment/Order.
     * Ce endpoint peut servir de relais ou pour d'autres providers avec vérification optionnelle.
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();
        $signature = $request->header('X-Webhook-Signature') ?? $request->header('X-Signature');
        $secret = config('shwary.webhook_secret');

        if (!empty($secret) && !empty($signature)) {
            $rawBody = $request->getContent();
            $expected = 'sha256=' . hash_hmac('sha256', $rawBody, $secret);
            if (!hash_equals($expected, $signature)) {
                Log::warning('Payment webhook: Invalid signature');
                return response()->json(['error' => 'Invalid signature'], 403);
            }
        }

        $eventId = $payload['id'] ?? $payload['transactionId'] ?? null;
        if ($eventId) {
            Log::info('Payment webhook received', ['event_id' => $eventId, 'payload_keys' => array_keys($payload)]);
        } else {
            Log::info('Payment webhook received', $payload);
        }

        return response()->json(['received' => true]);
    }
}
