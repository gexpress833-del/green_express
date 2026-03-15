<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Admin : liste des paiements (commandes + abonnements).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $query = Payment::query()
            ->with(['order:id,uuid,user_id,status', 'subscription:id,uuid,user_id,plan,status'])
            ->orderByDesc('created_at');

        $perPage = (int) $request->get('per_page', 20);
        $perPage = min(max($perPage, 5), 100);
        $payments = $query->paginate($perPage);

        return response()->json($payments);
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
