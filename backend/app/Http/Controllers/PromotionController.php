<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
use App\Models\Point;
use App\Models\PointLedger;
use App\Models\PromotionClaim;
use App\Services\CloudinaryService;
use App\Http\Requests\StorePromotionRequest;
use App\Http\Requests\UpdatePromotionRequest;
use App\Http\Traits\RoleAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PromotionController extends Controller
{
    use RoleAccess;
    public function index(Request $request)
    {
        // Si liste publique sans filtres, utiliser cache
        $cacheKey = 'promotions_list_' . $request->getQueryString();
        $cacheMinutes = 60; // 1 heure
        
        if (!$request->has('menu_id') && !$request->user()) {
            // Cache public list
            return Cache::remember($cacheKey, $cacheMinutes, function() use ($request) {
                return $this->fetchPromotions($request);
            });
        }

        return $this->fetchPromotions($request);
    }

    private function fetchPromotions(Request $request)
    {
        $query = Promotion::with('menu');
        
        // Filtrer les promotions actives (entre start_at et end_at)
        if ($request->boolean('active_only')) {
            $now = now();
            $query->where(function($q) use ($now) {
                $q->whereNull('start_at')->orWhere('start_at', '<=', $now);
            })->where(function($q) use ($now) {
                $q->whereNull('end_at')->orWhere('end_at', '>=', $now);
            });
        }
        
        // Si on demande la promotion actuelle unique (pour la landing page)
        if ($request->boolean('current')) {
            $now = now();
            $promo = Promotion::with('menu')
                ->where(function($q) use ($now) {
                    $q->whereNull('start_at')->orWhere('start_at', '<=', $now);
                })
                ->where(function($q) use ($now) {
                    $q->whereNull('end_at')->orWhere('end_at', '>=', $now);
                })
                ->orderBy('created_at', 'desc')
                ->first();
            
            return response()->json($promo);
        }

        // Visible pour le client : pas encore terminées (en cours + à venir)
        if ($request->boolean('visible_to_client')) {
            $now = now();
            $query->where(function($q) use ($now) {
                $q->whereNull('end_at')->orWhere('end_at', '>=', $now);
            });
            // Ordre : en cours d'abord, puis à venir par date de début
            $query->orderByRaw('CASE WHEN start_at IS NULL OR start_at <= ? THEN 0 ELSE 1 END DESC', [$now])
                ->orderBy('start_at', 'asc');
        }
        
        // Filtre par menu_id si fourni
        if ($request->has('menu_id')) {
            $query->where('menu_id', $request->input('menu_id'));
        }
        
        // Pagination
        $perPage = min(max($request->input('per_page', 15), 1), 100);
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Afficher une promotion (pour édition admin).
     */
    public function show($id)
    {
        $promo = Promotion::with('menu')->find($id);
        if (!$promo) {
            return response()->json(['message' => 'Promotion introuvable'], 404);
        }
        return response()->json($promo);
    }

    /**
     * Créer une promotion. Les promotions sont des repas spéciaux, distincts des plats du menu :
     * image, title et description sont propres à la promotion. menu_id reste optionnel (référence).
     */
    public function store(StorePromotionRequest $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié. Connectez-vous pour créer une promotion.'], 401);
        }
        try {
            $data = $request->validated();
            $data['admin_id'] = $user->id;
            $promo = Promotion::create($data);
            
            // Invalider le cache
            Cache::flush();
            
            return response()->json($promo->load('menu'), 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Promo store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la création de la promotion',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    /**
     * Mettre à jour une promotion (admin). Permet de changer l'image (URL Cloudinary).
     */
    public function update(UpdatePromotionRequest $request, $id)
    {
        $promo = Promotion::find($id);
        if (!$promo) {
            return response()->json(['message' => 'Promotion introuvable'], 404);
        }
        try {
            $data = $request->validated();
            $promo->update($data);
            Cache::flush();
            return response()->json($promo->load('menu'), 200);
        } catch (\Exception $e) {
            Log::error('Promo update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la mise à jour',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne',
            ], 500);
        }
    }

    /**
     * Supprimer une promotion (admin).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        $promo = Promotion::find($id);
        if (!$promo) {
            return response()->json(['message' => 'Promotion introuvable'], 404);
        }
        try {
            $promo->delete();
            Cache::flush();
            return response()->json(['message' => 'Promotion supprimée'], 200);
        } catch (\Exception $e) {
            Log::error('Promo destroy error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne',
            ], 500);
        }
    }

    public function claim(Request $request, $id)
    {
        $user = $request->user();

        // Defend: ensure route cannot be used by anonymous users even if middleware misconfigured
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $result = DB::transaction(function () use ($id, $user) {
            $promo = Promotion::lockForUpdate()->with('menu')->find($id);
            if (!$promo) {
                return response()->json(['message' => 'Promotion introuvable'], 404);
            }

            $now = now();
            if ($promo->start_at && $promo->start_at > $now) {
                return response()->json(['message' => 'Promotion pas encore active'], 400);
            }
            if ($promo->end_at && $promo->end_at < $now) {
                return response()->json(['message' => 'Promotion expirée'], 400);
            }

            // Vérifier quantité
            if (!is_null($promo->quantity_limit) && $promo->quantity_limit <= 0) {
                return response()->json(['message' => 'Promotion épuisée'], 400);
            }

            // Si des points sont requis, vérifier et décrémenter
            if (!is_null($promo->points_required) && $promo->points_required > 0) {
                $point = Point::where('user_id', $user->id)->lockForUpdate()->first();
                $balance = $point ? $point->balance : 0;
                if ($balance < $promo->points_required) {
                    return response()->json(['message' => 'Points insuffisants'], 400);
                }

                $point->balance = $balance - $promo->points_required;
                $point->save();

                PointLedger::create([
                    'user_id' => $user->id,
                    'delta' => -1 * (int) $promo->points_required,
                    'reason' => 'promo_claim',
                    'order_id' => null,
                ]);
            }

            // Décrémenter la quantité si applicable
            if (!is_null($promo->quantity_limit)) {
                $promo->quantity_limit = max(0, $promo->quantity_limit - 1);
                $promo->save();
            }

            // Générer un code ticket unique pour le vérificateur
            $ticketCode = 'GXT-' . strtoupper(Str::random(8));
            while (PromotionClaim::where('ticket_code', $ticketCode)->exists()) {
                $ticketCode = 'GXT-' . strtoupper(Str::random(8));
            }

            $claim = PromotionClaim::create([
                'user_id' => $user->id,
                'promotion_id' => $promo->id,
                'points_deducted' => (int)($promo->points_required ?? 0),
                'status' => 'claimed',
                'ticket_code' => $ticketCode,
            ]);

            return response()->json([
                'message' => 'Promotion réclamée avec succès',
                'promotion' => $promo,
                'ticket_code' => $ticketCode,
                'claim_id' => $claim->id,
            ], 200);
        });

        return $result;
    }

    public function myClaims(Request $request)
    {
        $user = $request->user();
        $perPage = min(max($request->input('per_page', 15), 1), 100);
        
        return PromotionClaim::where('user_id', $user->id)
            ->with(['promotion' => function($q) { $q->with('menu'); }])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Upload image vers Cloudinary
     */
    private function uploadImage($file)
    {
        try {
            return CloudinaryService::uploadImage($file, 'promotions');
        } catch (\Exception $e) {
            Log::error('Upload promo image error: ' . $e->getMessage());
            throw $e;
        }
    }
}
