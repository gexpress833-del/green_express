<?php

namespace App\Http\Controllers;

use App\Events\OrderRealtimeEvent;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Traits\AdminRequiresPermission;
use App\Models\Company;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Point;
use App\Models\PointLedger;
use App\Services\OrderNotificationService;
use App\Services\Orders\CreateClientOrderService;
use App\Services\Orders\FlexPayPendingPaymentSyncService;
use App\Services\Orders\OrderFlexPayInitiationService;
use App\Services\Orders\OrderManualPaymentConfirmationService;
use App\Services\PhoneRDCService;
use App\Support\OrderPaymentUserMessage;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use AdminRequiresPermission;

    public function __construct(
        private OrderNotificationService $orderNotifications,
        private CreateClientOrderService $createClientOrder,
        private OrderFlexPayInitiationService $orderFlexPayInitiation,
        private OrderManualPaymentConfirmationService $manualPaymentConfirmation,
        private FlexPayPendingPaymentSyncService $flexPayPendingSync,
    ) {}

    private function allowAdminOrCuisinier(Request $request): bool
    {
        $user = $request->user();

        return $user && (
            $user->hasPermissionTo('orders.change-status')
            || $user->canAsAdmin('orders.edit')
        );
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if ($user->hasPermissionTo('orders.list')) {
            return Order::with(['items.menu', 'user.points', 'deliveryDriver'])->orderByDesc('created_at')->get();
        }

        if ($user->hasPermissionTo('orders.list-own-menus')) {
            return Order::with(['items.menu', 'user', 'deliveryDriver'])
                ->whereHas('items.menu', function ($q) use ($user) {
                    $q->where('created_by', $user->id);
                })
                ->orderByDesc('created_at')
                ->get();
        }

        return Order::with('items.menu')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function show(Request $request, $id)
    {
        $viewer = $request->user();
        if (! $viewer) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $order = Order::with(['items.menu', 'deliveryDriver'])->findOrFail($id);

        if ($viewer->hasPermissionTo('orders.view-own') && (int) $order->user_id === (int) $viewer->id) {
            return response()->json($order);
        }

        if (
            $viewer->hasPermissionTo('entreprise.b2b.access')
            && $order->company_id
            && Company::where('contact_user_id', $viewer->id)->whereKey($order->company_id)->exists()
        ) {
            return response()->json($order->load(['items.menu', 'user', 'deliveryDriver']));
        }

        if ($viewer->hasPermissionTo('orders.view-assignments')) {
            if ((int) ($order->livreur_id ?? 0) !== (int) $viewer->id) {
                return response()->json(['message' => 'Accès refusé'], 403);
            }

            return response()->json($order->load(['items.menu', 'user', 'deliveryDriver']));
        }

        if ($viewer->hasPermissionTo('orders.view')) {
            return response()->json($order->load(['items.menu', 'user.points', 'deliveryDriver']));
        }

        if (! $this->allowAdminOrCuisinier($request)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $userRelation = $viewer->canAsAdmin('orders.view') ? 'user.points' : 'user';

        return response()->json($order->load(['items.menu', $userRelation, 'deliveryDriver']));
    }

    public function update(Request $request, $id)
    {
        if (! $this->allowAdminOrCuisinier($request)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $order = Order::findOrFail($id);
        $data = $request->validate([
            'status' => 'required|string|in:pending_payment,pending,paid,out_for_delivery,delivered,cancelled',
        ]);

        $oldStatus = (string) $order->status;
        $order->update(['status' => $data['status']]);
        $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, $data['status'], $request->user());

        return response()->json($order->load(['items.menu', 'user', 'deliveryDriver']));
    }

    public function destroy(Request $request, $id)
    {
        if ($r = $this->adminRequires($request, 'orders.delete')) {
            return $r;
        }

        $order = Order::findOrFail($id);
        $order->delete();

        return response()->json(['message' => 'Commande supprimée'], 200);
    }

    public function pdf(Request $request, $id)
    {
        if (! $this->allowAdminOrCuisinier($request)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $order = Order::with(['items.menu', 'user'])->findOrFail($id);
        $html = view('orders.pdf', ['order' => $order])->render();
        $pdf = Pdf::loadHTML($html);

        return $pdf->stream('commande-'.$order->id.'.pdf', ['Attachment' => true]);
    }

    public function assignLivreur(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        $canAssign = $user->hasPermissionTo('orders.assign-livreur')
            || $user->canAsAdmin('orders.assign-livreur');
        if (! $canAssign) {
            return response()->json(['message' => 'Accès refusé. Permission orders.assign-livreur requise.'], 403);
        }

        $data = $request->validate(['livreur_id' => 'required|integer|exists:users,id']);
        $driver = \App\Models\User::findOrFail($data['livreur_id']);
        if ($driver->role !== 'livreur') {
            return response()->json(['message' => 'L\'utilisateur sélectionné n\'est pas un livreur.'], 422);
        }

        if (! $order->delivery_code) {
            return response()->json(['message' => 'Aucun code livraison : assignation impossible.'], 422);
        }

        if (! in_array($order->status, ['pending', 'out_for_delivery'], true)) {
            return response()->json([
                'message' => 'Assignation impossible : la commande doit être en attente de livraison ou en cours de livraison (pas livrée, annulée ou autre statut).',
            ], 422);
        }

        $order->update(['livreur_id' => $data['livreur_id']]);

        OrderRealtimeEvent::dispatch($order->fresh(), 'livreur_assigned');

        return response()->json($order->load(['items.menu', 'user', 'deliveryDriver']));
    }

    public function store(StoreOrderRequest $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $order = $this->createClientOrder->create($user, $request->validated());

        return response()->json($order, 201);
    }

    /**
     * Initier un paiement FlexPay (Mobile Money RDC) pour une commande.
     */
    public function initiatePayment(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        $data = $request->validate([
            'client_phone_number' => ['required', 'string'],
            'country_code' => ['required', 'string', 'in:DRC'],
        ]);

        $result = $this->orderFlexPayInitiation->initiate($order, $user, $data);
        if (! $result['ok']) {
            $payload = ['message' => $result['message']];
            if (! empty($result['error'])) {
                $payload['error'] = $result['error'];
            }

            return response()->json($payload, $result['http_status']);
        }

        return response()->json($result['data']);
    }

    /**
     * Confirmation manuelle (tests / backoffice).
     */
    public function confirmPayment(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        if ($order->user_id !== $user->id && ! $user->canAsAdmin('orders.view')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        try {
            $paymentData = $request->input('payment_data');
            $raw = is_array($paymentData) ? $paymentData : ($paymentData !== null ? ['payload' => $paymentData] : []);

            $this->manualPaymentConfirmation->confirm(
                $order,
                $user,
                $request->input('provider', 'manual'),
                $request->input('provider_payment_id'),
                $request->input('currency', 'USD'),
                $raw,
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }

        $order->refresh();

        return response()->json([
            'order' => $order->load('items.menu'),
            'delivery_code' => $order->delivery_code,
            'message' => 'Paiement confirmé. Code de livraison généré.',
        ]);
    }

    /**
     * Etat clair du paiement d'une commande pour le client (polling UI).
     * Renvoie un statut consolide (pending / completed / failed / no_payment)
     * et un message lisible. Sert a remplacer le polling sur /api/orders.
     */
    public function paymentStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        if (! $user || ($order->user_id !== $user->id && ! $user->canAsAdmin('orders.view'))) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $this->flexPayPendingSync->trySyncOrderPayment($order);
        $order->refresh();
        $payment = Payment::where('order_id', $order->id)
            ->orderByDesc('id')
            ->first();

        $paymentStatus = $payment?->status ?? 'none';
        $orderStatus = (string) $order->status;
        $deliveryCode = $order->delivery_code;

        // Statut consolide pour le frontend
        if ($deliveryCode && in_array($orderStatus, ['paid', 'pending', 'out_for_delivery', 'delivered'], true)) {
            $consolidated = 'completed';
            $message = 'Paiement confirmé. Code de livraison généré.';
        } elseif ($paymentStatus === 'failed') {
            $consolidated = 'failed';
            $message = OrderPaymentUserMessage::humanizeFailureReason($payment?->failure_reason);
        } elseif ($paymentStatus === 'cancelled' || $orderStatus === 'cancelled') {
            $consolidated = 'cancelled';
            $message = 'Commande annulée.';
        } elseif ($paymentStatus === 'pending') {
            $consolidated = 'pending';
            $message = 'Paiement en attente : confirmez l\'opération sur votre téléphone (Mobile Money).';
        } else {
            $consolidated = 'no_payment';
            $message = 'Aucun paiement n\'a encore été initié pour cette commande.';
        }

        return response()->json([
            'order_id' => $order->id,
            'order_status' => $orderStatus,
            'payment_status' => $paymentStatus,
            'status' => $consolidated,
            'delivery_code' => $deliveryCode,
            'failure_reason' => $paymentStatus === 'failed'
                ? OrderPaymentUserMessage::humanizeFailureReason($payment?->failure_reason)
                : null,
            'message' => $message,
            'updated_at' => optional($payment?->updated_at)->toIso8601String(),
        ]);
    }

    /**
     * Permet au client (proprietaire) d'annuler sa commande tant que le paiement
     * n'a pas abouti. Utile en cas de solde insuffisant ou de paiement bloque.
     * Marque aussi tout Payment encore "pending" comme "cancelled".
     */
    public function cancelOwn(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }
        if ($order->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Cette commande ne vous appartient pas.'], 403);
        }

        $cancellableStatuses = ['pending_payment'];
        if (! in_array($order->status, $cancellableStatuses, true)) {
            return response()->json([
                'message' => 'Cette commande ne peut plus être annulée (paiement déjà confirmé ou statut avancé).',
            ], 400);
        }

        $oldStatus = (string) $order->status;
        $order->update(['status' => 'cancelled']);

        // Marque tout paiement encore en attente comme annule (n'ecrase pas completed/failed)
        Payment::where('order_id', $order->id)
            ->where('status', 'pending')
            ->update([
                'status' => 'cancelled',
                'failure_reason' => 'Annulée par le client',
            ]);

        $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'cancelled', $user);

        return response()->json([
            'message' => 'Commande annulée.',
            'order' => $order->load('items.menu'),
        ]);
    }

    /**
     * Valider le code de livraison et créditer les points.
     */
    public function validateCode(Request $request, $uuid)
    {
        try {
            $currentUser = $request->user();
            if (! $currentUser) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $code = strtoupper(trim((string) $request->input('code', '')));
            $request->merge(['code' => $code]);
            $data = $request->validate([
                'code' => 'required|string|size:9',
            ]);

            $order = Order::where('uuid', $uuid)->firstOrFail();

            $canValidate = $currentUser->canAsAdmin('orders.view')
                || $currentUser->hasPermissionTo('orders.validate-delivery-code');
            if (! $canValidate) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Non autorisé à valider un code de livraison.',
                ], 403);
            }

            if (
                ! $currentUser->canAsAdmin('orders.view')
                && $currentUser->hasPermissionTo('orders.validate-delivery-code')
                && (int) ($order->livreur_id ?? 0) !== (int) $currentUser->id
            ) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Cette commande ne vous est pas attribuée. Vous ne pouvez valider que vos propres livraisons.',
                ], 403);
            }

            if (! $order->delivery_code || $order->delivery_code !== $data['code']) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Code de livraison invalide.',
                ], 400);
            }

            if (! in_array($order->status, ['pending', 'paid', 'out_for_delivery'], true)) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Cette commande ne peut plus être validée.',
                ], 400);
            }

            $payment = Payment::where('order_id', $order->id)
                ->where('status', 'completed')
                ->first();
            if (! $payment) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Le paiement de cette commande n\'a pas été confirmé.',
                ], 400);
            }

            $pointsAlreadyCredited = PointLedger::where('order_id', $order->id)
                ->where('delta', '>', 0)
                ->exists();

            if ($pointsAlreadyCredited) {
                $oldStatus = (string) $order->status;
                $order->update(['status' => 'delivered']);
                $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'delivered', $currentUser);
                \App\Models\Invoice::createForOrderIfMissing($order);

                return response()->json([
                    'valid' => true,
                    'message' => 'Code valide. Commande déjà livrée.',
                    'order' => $order->load('items.menu'),
                ]);
            }

            $pointsEarned = (int) $order->points_earned;
            $point = Point::firstOrCreate(
                ['user_id' => $order->user_id],
                ['balance' => 0]
            );
            $point->increment('balance', $pointsEarned);

            PointLedger::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'delta' => $pointsEarned,
                'reason' => 'Points gagnés pour la commande #'.$order->uuid.' (validation livraison)',
            ]);

            $oldStatus = (string) $order->status;
            $order->update(['status' => 'delivered']);
            $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'delivered', $currentUser);
            \App\Models\Invoice::createForOrderIfMissing($order);

            return response()->json([
                'valid' => true,
                'message' => 'Code validé. Points crédités. Commande marquée comme livrée.',
                'order' => $order->load('items.menu'),
                'points_earned' => $pointsEarned,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Données invalides',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la validation du code',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne',
            ], 500);
        }
    }
}
