<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Menu;
use App\Models\Point;
use App\Models\PointLedger;
use App\Models\Payment;
use App\Http\Requests\StoreOrderRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Services\OrderNotificationService;
use App\Services\PhoneRDCService;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
{
    public function __construct(private OrderNotificationService $orderNotifications)
    {
    }

    private function allowAdminOrCuisinier(Request $request): bool
    {
        $user = $request->user();
        return $user && in_array($user->role, ['admin', 'cuisinier'], true);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // Admin et cuisinier voient toutes les commandes (avec livreur assigné)
        if ($user->role === 'admin' || $user->role === 'cuisinier') {
            return Order::with(['items.menu', 'user', 'deliveryDriver'])->orderBy('created_at', 'desc')->get();
        }

        return Order::with('items.menu')->where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
    }

    /**
     * Détail d'une commande (admin ou cuisinier).
     */
    public function show(Request $request, $id)
    {
        if (!$this->allowAdminOrCuisinier($request)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        $order = Order::with(['items.menu', 'user', 'deliveryDriver'])->findOrFail($id);
        return response()->json($order);
    }

    /**
     * Mise à jour du statut d'une commande (admin ou cuisinier).
     */
    public function update(Request $request, $id)
    {
        if (!$this->allowAdminOrCuisinier($request)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        $order = Order::findOrFail($id);
        $data = $request->validate([
            'status' => 'required|string|in:pending_payment,pending,paid,out_for_delivery,delivered,cancelled',
        ]);
        $oldStatus = (string) $order->status;
        $order->update(['status' => $data['status']]);
        $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, $data['status']);
        return response()->json($order->load(['items.menu', 'user', 'deliveryDriver']));
    }

    /**
     * Suppression d'une commande (admin uniquement).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé. Admin uniquement.'], 403);
        }
        $order = Order::findOrFail($id);
        $order->delete();
        return response()->json(['message' => 'Commande supprimée'], 200);
    }

    /**
     * Export PDF d'une commande (admin ou cuisinier).
     */
    public function pdf(Request $request, $id)
    {
        if (!$this->allowAdminOrCuisinier($request)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        $order = Order::with(['items.menu', 'user'])->findOrFail($id);
        $html = view('orders.pdf', ['order' => $order])->render();
        $pdf = Pdf::loadHTML($html);
        return $pdf->stream('commande-' . $order->id . '.pdf', ['Attachment' => true]);
    }

    /**
     * Attribuer un livreur à une commande (admin ou cuisinier uniquement).
     */
    public function assignLivreur(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();
        if ($user->role !== 'admin' && $user->role !== 'cuisinier') {
            return response()->json(['message' => 'Accès refusé. Rôle admin ou cuisinier requis'], 403);
        }
        $data = $request->validate(['livreur_id' => 'required|integer|exists:users,id']);
        $driver = \App\Models\User::findOrFail($data['livreur_id']);
        if ($driver->role !== 'livreur') {
            return response()->json(['message' => 'L\'utilisateur sélectionné n\'est pas un livreur.'], 422);
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

        // Calculer le total
        $total = 0;
        $totalQuantity = 0; // Total de plats pour calculer les points
        
        foreach ($data['items'] as $itemData) {
            $menu = Menu::findOrFail($itemData['menu_id']);
            $price = $itemData['price'] ?? $menu->price;
            $quantity = $itemData['quantity'];
            $total += $price * $quantity;
            $totalQuantity += $quantity; // Compter le nombre de plats
        }

        // Calcul des points : 12 points par plat (pas par montant)
        $pointsEarned = $totalQuantity * 12;

        // Créer la commande avec status 'pending_payment' (en attente de paiement)
        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $request->user()->id,
            'company_id' => $data['company_id'] ?? null,
            'status' => 'pending_payment', // En attente de paiement
            'delivery_address' => $data['delivery_address'],
            'total_amount' => $total,
            'points_earned' => $pointsEarned, // Points calculés mais pas encore crédités
            'delivery_code' => null, // Code généré après paiement
        ]);

        // Créer les items de commande
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

        // Notifications (création de commande)
        $this->orderNotifications->notifyOrderCreated($order->load('user'));

        return response()->json($order->load('items.menu'), 201);
    }

    /**
     * Initier un paiement Shwary pour une commande
     */
    public function initiatePayment(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        // Vérifier que la commande appartient à l'utilisateur
        if ($order->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Vérifier que la commande est en attente de paiement
        if ($order->status !== 'pending_payment') {
            return response()->json([
                'message' => 'Cette commande a déjà été payée ou ne peut pas être payée'
            ], 400);
        }

        // Valider les données de paiement
        $data = $request->validate([
            'client_phone_number' => 'required|string',
            'country_code' => 'required|string|in:DRC,KE,UG',
        ]);

        try {
            $shwaryService = app(\App\Services\ShwaryService::class);

            // Vérifier que Shwary est configuré
            if (!$shwaryService->isConfigured()) {
                return response()->json([
                    'message' => 'Service de paiement non configuré'
                ], 500);
            }

            $order->load('items.menu');
            $orderCurrency = $order->items->first()?->menu?->currency ?? config('shwary.default_order_currency', 'USD');
            $amountLocal = $shwaryService->convertToLocalAmount(
                (float) $order->total_amount,
                $orderCurrency,
                $data['country_code']
            );

            // RDC : normalisation complète, validation stricte, détection opérateur (évite erreurs Shwary)
            $phoneNormalized = null;
            $operator = null;
            if (strtoupper($data['country_code']) === 'DRC') {
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
            } else {
                $phoneNormalized = $shwaryService->normalizePhoneNumber(
                    $data['client_phone_number'],
                    $data['country_code']
                );
            }

            $callbackUrl = config('shwary.callback_url')
                ?: (rtrim(config('app.url'), '/') . '/api/shwary/callback');
            $metadata = [
                'order_id' => $order->id,
                'order_uuid' => $order->uuid,
                'user_id' => $order->user_id,
            ];

            $shwaryResponse = $shwaryService->initiatePayment(
                $amountLocal,
                $phoneNormalized,
                $data['country_code'],
                $callbackUrl,
                $metadata
            );

            // Stratégie stricte : on enregistre toujours en pending ; le webhook (ou le job fallback) met à jour.
            // En mock, Shwary peut renvoyer "completed" → on traite comme un webhook reçu pour éviter double logique.
            $payment = Payment::create([
                'order_id' => $order->id,
                'provider' => 'shwary',
                'provider_payment_id' => $shwaryResponse['id'],
                'reference_id' => $shwaryResponse['referenceId'] ?? null,
                'amount' => $shwaryResponse['amount'] ?? $order->total_amount,
                'currency' => $shwaryResponse['currency'] ?? 'CDF',
                'phone' => $phoneNormalized,
                'status' => 'pending',
                'raw_response' => $shwaryResponse,
            ]);

            $paymentStatus = $shwaryResponse['status'] ?? 'pending';
            if (strtolower((string) $paymentStatus) === 'completed') {
                // Mock ou sandbox : Shwary a déjà renvoyé completed → appliquer la même logique que le webhook
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
            $payload = [
                'order' => $order->load('items.menu'),
                'payment' => $payment->fresh(),
                'shwary_transaction' => $shwaryResponse,
                'amount_to_debit' => $amountLocal,
                'currency_to_debit' => $shwaryResponse['currency'] ?? 'CDF',
                'message' => $payment->status === 'completed'
                    ? 'Paiement complété. Code de livraison généré.'
                    : 'Paiement initié. En attente de confirmation sur votre mobile.',
                'delivery_code' => $deliveryCodeReturned,
                'payment_completed' => (bool) $deliveryCodeReturned,
            ];
            if (strtoupper($data['country_code'] ?? '') === 'DRC' && isset($operator)) {
                $payload['operator'] = $operator;
                $payload['operator_label'] = PhoneRDCService::operatorLabel($operator);
                $payload['phone_formatted'] = $phoneNormalized;
            }
            return response()->json($payload);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Données invalides',
                'error' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Shwary initiate payment failed', [
                'order_id' => $id,
                'error' => $e->getMessage(),
            ]);
            $message = $e->getMessage();
            // Erreurs Shwary (doc API) : messages clairs pour l'utilisateur
            if (stripos($message, 'destination number') !== false || stripos($message, 'number you have entered is invalid') !== false) {
                $message = 'Votre opérateur Mobile Money refuse le numéro. Utilisez 9 chiffres après +243 (ex: +243812345678 ou 0812345678).';
            } elseif (stripos($message, '2900') !== false && stripos($message, 'CDF') !== false) {
                $message = 'Le montant minimum pour un paiement Mobile Money en RDC est de 2900 FC. Votre commande est en dessous de ce seuil.';
            }
            return response()->json([
                'message' => $message,
                'error' => $message,
            ], 400);
        }
    }

    /**
     * Confirmer le paiement manuel (pour tests ou autres providers)
     * Génère le code unique de livraison après paiement
     */
    public function confirmPayment(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        // Vérifier que la commande appartient à l'utilisateur
        if ($order->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Vérifier que la commande est en attente de paiement
        if ($order->status !== 'pending_payment') {
            return response()->json([
                'message' => 'Cette commande a déjà été payée ou ne peut pas être payée'
            ], 400);
        }

        // Générer un code unique de livraison (format: GX-XXXXXX)
        $deliveryCode = 'GX-' . strtoupper(Str::random(6));
        
        // Vérifier l'unicité du code (très peu probable mais sécurité)
        while (Order::where('delivery_code', $deliveryCode)->exists()) {
            $deliveryCode = 'GX-' . strtoupper(Str::random(6));
        }

        // Créer un enregistrement de paiement
        Payment::create([
            'order_id' => $order->id,
            'provider' => $request->input('provider', 'manual'), // 'shwary', 'manual', etc.
            'provider_payment_id' => $request->input('provider_payment_id'),
            'amount' => $order->total_amount,
            'currency' => $request->input('currency', 'USD'),
            'status' => 'completed',
            'raw_response' => $request->input('payment_data'),
        ]);

        // Mettre à jour la commande : status 'paid' (paiement reçu, en attente de livraison) et générer le code
        $oldStatus = (string) $order->status;
        $order->update([
            'status' => 'paid',
            'delivery_code' => $deliveryCode,
        ]);

        $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'paid');
        
        return response()->json([
            'order' => $order->load('items.menu'),
            'delivery_code' => $deliveryCode,
            'message' => 'Paiement confirmé. Code de livraison généré.'
        ]);
    }

    /**
     * Mapper le statut Shwary vers le statut Payment
     */
    private function mapShwaryStatusToPaymentStatus($shwaryStatus)
    {
        return match($shwaryStatus) {
            'pending' => 'pending',
            'completed' => 'completed',
            'failed' => 'failed',
            default => 'pending',
        };
    }

    /**
     * Valider le code de livraison et créditer les points
     * Cette méthode est appelée par le livreur après validation du code
     * NOTE: Cette méthode est maintenant utilisée par le LivreurController
     * Elle est conservée pour compatibilité mais devrait être déplacée
     */
    public function validateCode(Request $request, $uuid)
    {
        try {
            $data = $request->validate([
                'code' => 'required|string|size:9', // Format: GX-XXXXXX
            ]);

            $order = Order::where('uuid', $uuid)->firstOrFail();
            $user = $request->user();

            // Vérifier que le code correspond
            if (!$order->delivery_code || $order->delivery_code !== $data['code']) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Code de livraison invalide.'
                ], 400);
            }

            // Vérifier que la commande est dans un statut approprié pour validation
            if (!in_array($order->status, ['pending', 'out_for_delivery'])) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Cette commande ne peut plus être validée.'
                ], 400);
            }

            // Vérifier que le paiement a été effectué
            $payment = Payment::where('order_id', $order->id)
                ->where('status', 'completed')
                ->first();
            
            if (!$payment) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Le paiement de cette commande n\'a pas été confirmé.'
                ], 400);
            }

            // Vérifier que les points n'ont pas déjà été crédités
            $pointsAlreadyCredited = PointLedger::where('order_id', $order->id)
                ->where('delta', '>', 0)
                ->exists();

            if ($pointsAlreadyCredited) {
                // Les points ont déjà été crédités, juste mettre à jour le statut
                $oldStatus = (string) $order->status;
                $order->update(['status' => 'delivered']);
                $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'delivered');
                \App\Models\Invoice::createForOrderIfMissing($order);
                return response()->json([
                    'valid' => true,
                    'message' => 'Code valide. Commande déjà livrée.',
                    'order' => $order->load('items.menu')
                ]);
            }

            // Code valide - créditer les points et marquer comme livrée
            $pointsEarned = $order->points_earned;

            // Créer ou mettre à jour les points de l'utilisateur
            $point = Point::firstOrCreate(
                ['user_id' => $order->user_id],
                ['balance' => 0]
            );
            $point->increment('balance', $pointsEarned);
            
            // Enregistrer dans le ledger
            PointLedger::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'delta' => $pointsEarned,
                'reason' => 'Points gagnés pour la commande #' . $order->uuid . ' (validation livraison)',
            ]);

            // Mettre à jour le statut de la commande
            $oldStatus = (string) $order->status;
            $order->update(['status' => 'delivered']);
            $this->orderNotifications->notifyStatusChanged($order->load('user'), $oldStatus, 'delivered');
            \App\Models\Invoice::createForOrderIfMissing($order);
            return response()->json([
                'valid' => true,
                'message' => 'Code validé. Points crédités. Commande marquée comme livrée.',
                'order' => $order->load('items.menu'),
                'points_earned' => $pointsEarned
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la validation du code',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }
}
