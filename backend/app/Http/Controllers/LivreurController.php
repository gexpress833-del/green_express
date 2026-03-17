<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Point;
use App\Models\User;
use App\Models\PointLedger;
use App\Http\Traits\RoleAccess;
use Illuminate\Http\Request;
use App\Services\OrderNotificationService;

class LivreurController extends Controller
{
    use RoleAccess;

    public function __construct(private OrderNotificationService $orderNotifications)
    {
    }

    public function stats(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            // Seuls les livreurs et admins peuvent voir ces stats
            if ($user->role !== 'livreur' && $user->role !== 'admin') {
                return response()->json([
                    'message' => 'Accès refusé. Rôle livreur ou admin requis',
                    'current_role' => $user->role
                ], 403);
            }

            // Les livreurs ne voient que leurs propres stats, les admins voient tout
            $userId = $user->role === 'admin' ? $request->input('user_id', $user->id) : $user->id;

            $assigned = Order::where('livreur_id', $userId)
                ->whereIn('status', ['pending', 'paid', 'out_for_delivery'])
                ->whereNotNull('delivery_code')
                ->count();

            $delivered = Order::where('livreur_id', $userId)
                ->where('status', 'delivered')
                ->count();

            $totalDeliveries = $delivered;
            $totalAssigned = $assigned + $delivered;
            $rating = $totalAssigned > 0 ? round(($totalDeliveries / $totalAssigned) * 5, 1) : 0;
            $rating = min($rating, 5.0);

            return response()->json([
                'assigned' => $assigned,
                'delivered' => $delivered,
                'rating' => $rating,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    /** Liste des livreurs pour attribution (admin ou cuisinier). */
    public function listForAssignment(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) return response()->json(['message' => 'Non authentifié'], 401);
            if ($user->role !== 'admin' && $user->role !== 'cuisinier') {
                return response()->json(['message' => 'Accès refusé. Rôle admin ou cuisinier requis', 'current_role' => $user->role], 403);
            }
            $livreurs = User::where('role', 'livreur')->orderBy('name')->get(['id', 'name', 'email']);
            return response()->json($livreurs);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des livreurs', 'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'], 500);
        }
    }

    /**
     * Obtenir les commandes assignées au livreur connecté (ou toutes pour l'admin).
     * Le livreur ne voit que les commandes dont livreur_id = son id (assignées par l'admin ou le cuisinier).
     */
    public function getAssignments(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            if ($user->role !== 'livreur' && $user->role !== 'admin') {
                return response()->json([
                    'message' => 'Accès refusé. Rôle livreur ou admin requis',
                    'current_role' => $user->role
                ], 403);
            }

            $query = Order::with('items.menu', 'user')
                ->whereIn('status', ['pending', 'paid', 'out_for_delivery'])
                ->whereNotNull('delivery_code')
                ->orderBy('created_at', 'asc');

            // Le livreur ne voit que les commandes qui lui sont attribuées
            if ($user->role === 'livreur') {
                $query->where('livreur_id', $user->id);
            }

            $orders = $query->get();

            return response()->json($orders);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des commandes',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    /**
     * Valider le code de livraison et créditer les points
     * C'est le livreur qui valide le code lors de la livraison
     */
    public function validateDeliveryCode(Request $request)
    {
        try {
            $code = strtoupper(trim((string) $request->input('code', '')));
            $request->merge(['code' => $code]);
            $data = $request->validate([
                'code' => 'required|string|size:9', // Format: GX-XXXXXX
            ]);

            $currentUser = $request->user();
            if (!$currentUser) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            // Trouver la commande avec ce code
            $order = Order::where('delivery_code', $data['code'])
                ->whereIn('status', ['pending', 'paid', 'out_for_delivery'])
                ->first();

            if (!$order) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Code incorrect ou commande déjà livrée. Vérifiez le code avec le client (format GX-XXXXXX).'
                ], 400);
            }

            // Le livreur ne peut valider que les commandes qui lui sont attribuées (l'admin peut tout valider)
            if ($currentUser->role === 'livreur' && (int) $order->livreur_id !== (int) $currentUser->id) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Cette commande ne vous est pas attribuée. Vous ne pouvez valider que vos propres livraisons.'
                ], 403);
            }

            // Vérifier que le paiement a été effectué
            $payment = Payment::where('order_id', $order->id)
                ->where('status', 'completed')
                ->first();

            // En local/sandbox : si la commande a un code mais pas de paiement (données de test), en créer un pour permettre la validation
            if (!$payment && $order->delivery_code && app()->environment('local')) {
                Payment::create([
                    'order_id' => $order->id,
                    'provider' => 'manual',
                    'provider_payment_id' => 'dev-' . $order->id,
                    'amount' => $order->total_amount,
                    'currency' => 'CDF',
                    'status' => 'completed',
                    'raw_response' => ['created_for_validate_code_local' => true],
                ]);
                $payment = Payment::where('order_id', $order->id)->where('status', 'completed')->first();
            }

            if (!$payment) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Le paiement de cette commande n\'a pas été confirmé. Le client doit d\'abord payer (étape « Payer avec Mobile Money ») pour que le code soit valide.'
                ], 400);
            }

            // Vérifier que les points n'ont pas déjà été crédités
            $pointsAlreadyCredited = PointLedger::where('order_id', $order->id)
                ->where('delta', '>', 0)
                ->exists();

            if ($pointsAlreadyCredited) {
                // Les points ont déjà été crédités, juste mettre à jour le statut
                $order->update(['status' => 'delivered']);
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
                'reason' => 'Points gagnés pour la commande #' . $order->uuid . ' (validation livraison par livreur)',
            ]);

            // Assigner le livreur à la commande si pas encore fait, puis marquer livrée
            $oldStatus = (string) $order->status;
            $order->update([
                'status' => 'delivered',
                'livreur_id' => $order->livreur_id ?? $request->user()->id,
            ]);

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
