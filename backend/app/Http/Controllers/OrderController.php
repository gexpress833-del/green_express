<?php

namespace App\Http\Controllers;

use App\Http\Traits\AdminRequiresPermission;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Company;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Point;
use App\Models\PointLedger;
use App\Events\OrderRealtimeEvent;
use App\Services\FlexPayService;
use App\Services\OrderNotificationService;
use App\Services\PhoneRDCService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    use AdminRequiresPermission;

    public function __construct(private OrderNotificationService $orderNotifications)
    {
    }

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

        return $pdf->stream('commande-' . $order->id . '.pdf', ['Attachment' => true]);
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

        $data = $request->validated();
        $total = 0.0;
        $totalQuantity = 0;

        foreach ($data['items'] as $itemData) {
            $menu = Menu::findOrFail($itemData['menu_id']);
            $price = $itemData['price'] ?? $menu->price;
            $quantity = (int) $itemData['quantity'];

            $total += $price * $quantity;
            $totalQuantity += $quantity;
        }

        $pointsEarned = $totalQuantity * 12;

        $phoneNorm = PhoneRDCService::formatPhoneRDC($data['client_phone_number']);
        if (! PhoneRDCService::isValidPhoneRDC($phoneNorm)) {
            throw ValidationException::withMessages([
                'client_phone_number' => ['Numéro Mobile Money invalide (RDC : 9 chiffres après l’indicatif 243).'],
            ]);
        }

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'company_id' => $data['company_id'] ?? null,
            'status' => 'pending_payment',
            'delivery_address' => $data['delivery_address'],
            'client_phone_number' => $phoneNorm,
            'total_amount' => $total,
            'points_earned' => $pointsEarned,
            'delivery_code' => null,
        ]);

        foreach ($data['items'] as $itemData) {
            $menu = Menu::findOrFail($itemData['menu_id']);
            $price = $itemData['price'] ?? $menu->price;

            OrderItem::create([
                'order_id' => $order->id,
                'menu_id' => $itemData['menu_id'],
                'quantity' => $itemData['quantity'],
                'price' => $price,
            ]);
        }

        $this->orderNotifications->notifyOrderCreated($order->load('user'));
        return response()->json($order->load('items.menu'), 201);
    }

    /**
     * Initier un paiement FlexPay (Mobile Money RDC) pour une commande.
     */
    public function initiatePayment(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        if ($order->user_id !== $user->id && ! $user->canAsAdmin('orders.view')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($order->status !== 'pending_payment') {
            // Cas retrocompatibilite : une version precedente du callback FlexPay
            // mettait automatiquement Order.status='cancelled' sur echec de paiement,
            // ce qui empechait toute re-tentative. On autorise une reactivation
            // automatique tant que :
            //  - aucun paiement n'a ete complete avec succes
            //  - le client n'a PAS explicitement annule (cancelOwn marque le Payment en 'cancelled')
            $hasCompleted = Payment::where('order_id', $order->id)->where('status', 'completed')->exists();
            $hasExplicitCancel = Payment::where('order_id', $order->id)->where('status', 'cancelled')->exists();
            if ($order->status === 'cancelled' && ! $hasCompleted && ! $hasExplicitCancel) {
                $order->update(['status' => 'pending_payment']);
            } else {
                return response()->json(['message' => 'Cette commande a déjà été payée ou ne peut pas être payée'], 400);
            }
        }

        $data = $request->validate([
            'client_phone_number' => 'required|string',
            'country_code' => 'required|string|in:DRC',
        ]);

        try {
            $flexPay = app(FlexPayService::class);

            if (! $flexPay->isConfigured()) {
                return response()->json([
                    'message' => 'Paiement Mobile Money temporairement indisponible. Réessayez plus tard ou contactez le support.',
                    'error' => 'payment_not_configured',
                ], 503);
            }

            $formatted = PhoneRDCService::formatPhoneRDC($data['client_phone_number']);
            if (! PhoneRDCService::isValidPhoneRDC($formatted)) {
                return response()->json([
                    'message' => 'Numéro invalide. Utilisez un numéro à 9 chiffres (ex. 0812345678 ou 812345678).',
                    'error' => 'Numéro invalide',
                ], 400);
            }
            $operator = PhoneRDCService::detectOperatorRDC($formatted);
            if ($operator === null) {
                return response()->json([
                    'message' => 'Opérateur non reconnu. Utilisez un numéro Vodacom (81–83), Airtel (97–99), Orange (84, 85, 89) ou Afrimoney / Africell (90–91).',
                    'error' => 'Opérateur non reconnu',
                ], 400);
            }
            $phoneNormalized = PhoneRDCService::toE164($formatted);
            $phone12 = $formatted;

            $order->load('items.menu');
            $orderCurrency = $order->items->first()?->menu?->currency ?? 'USD';
            $resolved = $flexPay->resolveAmountAndCurrency((float) $order->total_amount, (string) $orderCurrency);

            $reference = 'ORD-' . $order->id . '-' . Str::lower(Str::random(12));

            $callbackUrl = config('flexpay.callback_url')
                ?: (rtrim(config('app.url'), '/') . '/api/flexpay/callback');

            $flexResponse = $flexPay->initiateMobilePayment(
                $resolved['amount'],
                $resolved['currency'],
                $phone12,
                $reference,
                'Commande #' . $order->id,
                $callbackUrl
            );

            $payment = Payment::create([
                'order_id' => $order->id,
                'provider' => 'flexpay',
                'provider_payment_id' => $flexResponse['id'],
                'reference_id' => $flexResponse['referenceId'] ?? $reference,
                'amount' => $flexResponse['amount'] ?? $resolved['amount'],
                'currency' => $flexResponse['currency'] ?? $resolved['currency'],
                'phone' => $phoneNormalized,
                'status' => 'pending',
                'raw_response' => $flexResponse,
            ]);

            $paymentStatus = $flexResponse['status'] ?? 'pending';
            if (strtolower((string) $paymentStatus) === 'completed') {
                $payment->update(['status' => 'completed']);
                if ($order->status === 'pending_payment') {
                    $oldStatus = (string) $order->status;
                    $deliveryCode = 'GX-' . strtoupper(Str::random(6));
                    while (Order::where('delivery_code', $deliveryCode)->exists()) {
                        $deliveryCode = 'GX-' . strtoupper(Str::random(6));
                    }
                    $order->update([
                        'status' => 'paid',
                        'delivery_code' => $deliveryCode,
                    ]);
                    $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid');
                }
            }

            $deliveryCodeReturned = $order->fresh()->delivery_code;

            return response()->json([
                'order' => $order->load('items.menu'),
                'payment' => $payment->fresh(),
                'flexpay_transaction' => $flexResponse,
                'amount_to_debit' => $resolved['amount'],
                'currency_to_debit' => $resolved['currency'],
                'message' => $payment->status === 'completed'
                    ? 'Paiement complété. Code de livraison généré.'
                    : 'Paiement initié. En attente de confirmation sur votre mobile.',
                'delivery_code' => $deliveryCodeReturned,
                'payment_completed' => (bool) $deliveryCodeReturned,
                'operator' => $operator,
                'operator_label' => PhoneRDCService::operatorLabel($operator),
                'phone_formatted' => $phoneNormalized,
            ]);
        } catch (\Exception $e) {
            Log::warning('FlexPay initiate payment failed', [
                'order_id' => $id,
                'error' => $e->getMessage(),
            ]);

            $message = $e->getMessage();
            // Ne pas exposer le nom du prestataire technique dans les messages affichés au client
            $message = preg_replace('/\bFlexPay\b|\bFlexPaie\b/ui', 'le service de paiement', $message);
            if (stripos($message, 'destination number') !== false || stripos($message, 'number you have entered is invalid') !== false) {
                $message = 'Votre opérateur Mobile Money refuse le numéro. Utilisez 9 chiffres après +243 (ex: +243812345678 ou 0812345678).';
            } elseif (stripos($message, 'minimum') !== false && stripos($message, 'CDF') !== false) {
                $message = 'Le montant minimum pour un paiement Mobile Money en CDF n’est pas atteint pour cette commande.';
            }

            return response()->json([
                'message' => $message,
                'error' => $message,
            ], 400);
        }
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
        if ($order->status !== 'pending_payment') {
            return response()->json(['message' => 'Cette commande a déjà été payée ou ne peut pas être payée'], 400);
        }

        $deliveryCode = 'GX-' . strtoupper(Str::random(6));
        while (Order::where('delivery_code', $deliveryCode)->exists()) {
            $deliveryCode = 'GX-' . strtoupper(Str::random(6));
        }

        Payment::create([
            'order_id' => $order->id,
            'provider' => $request->input('provider', 'manual'),
            'provider_payment_id' => $request->input('provider_payment_id'),
            'amount' => $order->total_amount,
            'currency' => $request->input('currency', 'USD'),
            'status' => 'completed',
            'raw_response' => $request->input('payment_data'),
        ]);

        $oldStatus = (string) $order->status;
        $order->update([
            'status' => 'paid',
            'delivery_code' => $deliveryCode,
        ]);

        $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid', $request->user());

        return response()->json([
            'order' => $order->load('items.menu'),
            'delivery_code' => $deliveryCode,
            'message' => 'Paiement confirmé. Code de livraison généré.',
        ]);
    }

    /**
     * Convertit un failure_reason technique en message clair pour le client.
     * - Masque le nom du prestataire (FlexPay/FlexPaie).
     * - Remplace les valeurs generiques peu lisibles ("Echec FlexPay") par un texte explicite.
     * - Detecte quelques motifs frequents (solde insuffisant, refus operateur, timeout USSD).
     */
    private function humanizePaymentFailureReason(?string $reason): string
    {
        $r = trim((string) $reason);
        if ($r === '') {
            return 'Le paiement Mobile Money n\'a pas abouti. Aucun montant n\'a été débité.';
        }

        $lower = mb_strtolower($r);

        // Cas generiques sans info utile cote utilisateur
        if (preg_match('/^(echec|échec)\s+(flexpay|flexpaie|paiement)?\s*$/u', $lower)
            || preg_match('/^(failed|payment\s*failed)$/u', $lower)
            || $lower === 'flexpay'
            || $lower === 'flexpaie'
        ) {
            return 'Le paiement Mobile Money a été refusé. Vérifiez votre solde, votre opérateur ou réessayez.';
        }

        // Motifs frequents (solde, USSD, refus operateur)
        if (preg_match('/insufficient|insuffisant|solde/iu', $r)) {
            return 'Solde Mobile Money insuffisant. Rechargez votre compte ou utilisez un autre numéro, puis réessayez.';
        }
        if (preg_match('/timeout|timed?\s*out|expir|d.lai/iu', $r)) {
            return 'Aucune confirmation reçue à temps sur votre téléphone (USSD). Réessayez et validez le code dans la minute.';
        }
        if (preg_match('/cancel|refus|denied|reject/iu', $r)) {
            return 'Paiement refusé par votre opérateur Mobile Money ou annulé sur le téléphone. Réessayez si nécessaire.';
        }
        if (preg_match('/destination number|number you have entered is invalid/iu', $r)) {
            return 'Numéro Mobile Money invalide pour votre opérateur. Vérifiez le numéro saisi.';
        }

        // Sinon : on conserve le texte fourni mais on masque le nom du prestataire
        $clean = preg_replace('/\bFlex\s*Pa(?:y|ie)\b/ui', 'le service de paiement', $r);
        return (string) $clean;
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

        $payment = Payment::where('order_id', $order->id)
            ->orderByDesc('id')
            ->first();

        // Check actif vers FlexPay : certains operateurs Mobile Money n'envoient
        // PAS de callback quand l'utilisateur annule l'USSD ou quand il y a un
        // refus silencieux. On interroge directement /check/{orderNumber} si le
        // paiement est encore en pending depuis plus de 15s, au plus une fois
        // toutes les 15s pour ne pas surcharger FlexPay.
        if (
            $payment
            && $payment->status === 'pending'
            && $payment->provider_payment_id
            && $payment->updated_at
            && $payment->updated_at->lt(now()->subSeconds(15))
        ) {
            try {
                $flexPay = app(FlexPayService::class);
                $check = $flexPay->checkTransaction((string) $payment->provider_payment_id);
                if (is_array($check)) {
                    if ($check['paid'] ?? false) {
                        // Synchro vers completed + Order paid + delivery_code
                        $payment->update([
                            'status' => 'completed',
                            'failure_reason' => null,
                            'raw_response' => array_merge($payment->raw_response ?? [], ['last_check' => $check['raw'] ?? []]),
                        ]);
                        if ($order->status === 'pending_payment') {
                            $oldStatus = (string) $order->status;
                            $deliveryCode = 'GX-' . strtoupper(Str::random(6));
                            while (Order::where('delivery_code', $deliveryCode)->exists()) {
                                $deliveryCode = 'GX-' . strtoupper(Str::random(6));
                            }
                            $order->update(['status' => 'paid', 'delivery_code' => $deliveryCode]);
                            $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid');
                        }
                        $payment->refresh();
                        $order->refresh();
                    } elseif ($check['failed'] ?? false) {
                        $payment->update([
                            'status' => 'failed',
                            'failure_reason' => $payment->failure_reason ?: 'Échec FlexPay',
                            'raw_response' => array_merge($payment->raw_response ?? [], ['last_check' => $check['raw'] ?? []]),
                        ]);
                        $payment->refresh();
                    } else {
                        // Toujours pending : on touch updated_at pour eviter de re-checker tout de suite
                        $payment->touch();
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('FlexPay active check failed', ['order_id' => $order->id, 'msg' => $e->getMessage()]);
            }
        }

        $paymentStatus = $payment?->status ?? 'none';
        $orderStatus = (string) $order->status;
        $deliveryCode = $order->delivery_code;

        // Statut consolide pour le frontend
        if ($deliveryCode && in_array($orderStatus, ['paid', 'pending', 'out_for_delivery', 'delivered'], true)) {
            $consolidated = 'completed';
            $message = 'Paiement confirmé. Code de livraison généré.';
        } elseif ($paymentStatus === 'failed') {
            $consolidated = 'failed';
            $message = $this->humanizePaymentFailureReason($payment->failure_reason);
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
            'failure_reason' => $payment?->failure_reason,
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
                'reason' => 'Points gagnés pour la commande #' . $order->uuid . ' (validation livraison)',
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

