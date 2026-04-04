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

        if ($user->hasPermissionTo('orders.list')) {
            return Order::with(['items.menu', 'user.points', 'deliveryDriver'])->orderByDesc('created_at')->get();
        }

        if ($user->hasPermissionTo('orders.list-own-menus')) {
            return Order::with(['items.menu', 'user', 'deliveryDriver'])->orderByDesc('created_at')->get();
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
            return response()->json(['message' => 'Cette commande a déjà été payée ou ne peut pas être payée'], 400);
        }

        $data = $request->validate([
            'client_phone_number' => 'required|string',
            'country_code' => 'required|string|in:DRC',
        ]);

        try {
            $flexPay = app(FlexPayService::class);

            if (! $flexPay->isConfigured()) {
                return response()->json([
                    'message' => 'Paiement Mobile Money indisponible : FlexPay n’est pas configuré sur le serveur (variables FLEXPAY_MERCHANT et FLEXPAY_TOKEN sur l’hébergement).',
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
                    'message' => 'Opérateur non reconnu. Utilisez un numéro Vodacom (81-83), Airtel (97-99) ou Orange (84, 85, 89).',
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
     * Valider le code de livraison et créditer les points.
     */
    public function validateCode(Request $request, $uuid)
    {
        try {
            $data = $request->validate([
                'code' => 'required|string|size:9',
            ]);

            $order = Order::where('uuid', $uuid)->firstOrFail();
            $user = $request->user();

            if (! $order->delivery_code || $order->delivery_code !== $data['code']) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Code de livraison invalide.',
                ], 400);
            }

            if (! in_array($order->status, ['pending', 'out_for_delivery'], true)) {
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
                $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'delivered', $user);
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
            $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'delivered', $user);
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

