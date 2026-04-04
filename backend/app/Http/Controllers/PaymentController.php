<?php

namespace App\Http\Controllers;

use App\Http\Traits\AdminRequiresPermission;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    use AdminRequiresPermission;

    /**
     * Admin : liste paginée des paiements avec filtres.
     */
    public function index(Request $request)
    {
        if ($r = $this->adminRequires($request, 'admin.payments')) {
            return $r;
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
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to'));
        }

        $perPage = (int) $request->get('per_page', 20);
        $perPage = min(max($perPage, 5), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Admin : statistiques paiements.
     */
    public function stats(Request $request)
    {
        if ($r = $this->adminRequires($request, 'admin.payments')) {
            return $r;
        }

        $base = Payment::query();

        return response()->json([
            'total' => (clone $base)->count(),
            'total_success' => (clone $base)->whereIn('status', ['completed', 'paid'])->count(),
            'total_failed' => (clone $base)->where('status', 'failed')->count(),
            'total_pending' => (clone $base)->where('status', 'pending')->count(),
            'revenue' => round((float) (clone $base)->whereIn('status', ['completed', 'paid'])->sum('amount'), 2),
        ]);
    }

    /**
     * Admin : déclenchement manuel de réconciliation (message informatif).
     */
    public function reconcile(Request $request)
    {
        if ($r = $this->adminRequires($request, 'admin.payments')) {
            return $r;
        }

        $user = $request->user();
        Log::info('Admin triggered payment reconciliation', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Réconciliation déclenchée. Les paiements affichés proviennent de la base locale. Pour synchroniser avec FlexPay, configurez le webhook et les jobs.',
        ]);
    }

    /**
     * Webhook générique (optionnel). Pour FlexPay, utiliser POST /api/flexpay/callback.
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();
        $signature = $request->header('X-Webhook-Signature') ?? $request->header('X-Signature');
        $secret = config('flexpay.webhook_secret') ?: env('PAYMENT_WEBHOOK_SECRET');

        if (! empty($secret) && ! empty($signature)) {
            $rawBody = $request->getContent();
            $expected = 'sha256=' . hash_hmac('sha256', $rawBody, $secret);
            if (! hash_equals($expected, (string) $signature)) {
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
