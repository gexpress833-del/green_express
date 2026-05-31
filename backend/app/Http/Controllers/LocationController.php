<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Events\DriverLocationUpdated;
use Illuminate\Support\Facades\Validator;

class LocationController extends Controller
{
    /**
     * POST /api/customer/location
     * Le client envoie sa position pour une commande donnée.
     */
    public function storeCustomerLocation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'order_id'  => 'nullable|integer|exists:orders,id',
            'accuracy'  => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Coordonnées invalides.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], 401);
        }

        $data = [
            'delivery_latitude'  => $request->input('latitude'),
            'delivery_longitude' => $request->input('longitude'),
        ];

        // Si order_id fourni, mettre à jour la commande spécifique
        if ($request->filled('order_id')) {
            $order = Order::where('id', $request->input('order_id'))
                ->where('user_id', $user->id)
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande introuvable ou non autorisée.',
                ], 404);
            }

            $order->update($data);
        } else {
            // Mettre à jour la commande la plus récente du client
            $order = Order::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'preparing', 'ready', 'assigned', 'out_for_delivery'])
                ->latest()
                ->first();

            if ($order) {
                $order->update($data);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Position enregistrée.',
            'data'    => $data,
        ]);
    }

    /**
     * POST /api/driver/location
     * Le livreur envoie sa position actuelle.
     */
    public function storeDriverLocation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'order_id'  => 'nullable|integer|exists:orders,id',
            'accuracy'  => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Coordonnées invalides.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        if (!$user || $user->role !== 'livreur') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux livreurs.',
            ], 403);
        }

        $data = [
            'driver_latitude'   => $request->input('latitude'),
            'driver_longitude'  => $request->input('longitude'),
            'location_updated_at' => now(),
        ];

        if ($request->filled('order_id')) {
            $order = Order::where('id', $request->input('order_id'))
                ->where('livreur_id', $user->id)
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande introuvable ou non assignée à vous.',
                ], 404);
            }

            $order->update($data);

            // Broadcasting temps réel : notifier le client
            broadcast(new DriverLocationUpdated($order))->toOthers();
        } else {
            // Mettre à jour toutes les commandes en cours du livreur
            Order::where('livreur_id', $user->id)
                ->whereIn('status', ['assigned', 'out_for_delivery'])
                ->update($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Position livreur enregistrée.',
            'data'    => [
                'latitude'  => $request->input('latitude'),
                'longitude' => $request->input('longitude'),
            ],
        ]);
    }

    /**
     * GET /api/orders/{id}/location
     * Récupère la position d'une commande (client et livreur).
     */
    public function getOrderLocation(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], 401);
        }

        $order = Order::find($id);
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Commande introuvable.',
            ], 404);
        }

        // Vérifier que l'utilisateur est autorisé à voir cette commande
        $isOwner = $order->user_id === $user->id;
        $isDriver = $order->livreur_id === $user->id;
        $isAdmin = in_array($user->role, ['admin', 'agent']);

        if (!$isOwner && !$isDriver && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'order_id'            => $order->id,
                'delivery_latitude'   => $order->delivery_latitude,
                'delivery_longitude'  => $order->delivery_longitude,
                'driver_latitude'     => $order->driver_latitude,
                'driver_longitude'    => $order->driver_longitude,
                'location_updated_at' => $order->location_updated_at,
                'status'              => $order->status,
            ],
        ]);
    }

    /**
     * GET /api/orders/{id}/tracking
     * Récupère les détails complets de tracking d'une commande.
     */
    public function getOrderTracking(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], 401);
        }

        $order = Order::with(['user', 'livreur'])->find($id);
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Commande introuvable.',
            ], 404);
        }

        $isOwner = $order->user_id === $user->id;
        $isDriver = $order->livreur_id === $user->id;
        $isAdmin = in_array($user->role, ['admin', 'agent']);

        if (!$isOwner && !$isDriver && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'order' => [
                    'id'                   => $order->id,
                    'status'               => $order->status,
                    'delivery_address'     => $order->delivery_address,
                    'delivery_latitude'    => $order->delivery_latitude,
                    'delivery_longitude'   => $order->delivery_longitude,
                    'driver_latitude'      => $order->driver_latitude,
                    'driver_longitude'     => $order->driver_longitude,
                    'location_updated_at'  => $order->location_updated_at,
                    'created_at'           => $order->created_at,
                    'updated_at'           => $order->updated_at,
                ],
                'customer' => $order->user ? [
                    'name'  => $order->user->name,
                    'phone' => $order->user->phone,
                ] : null,
                'driver' => $order->livreur ? [
                    'name'  => $order->livreur->name,
                    'phone' => $order->livreur->phone,
                ] : null,
            ],
        ]);
    }
}
