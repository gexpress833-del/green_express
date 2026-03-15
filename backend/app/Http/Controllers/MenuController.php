<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Services\CloudinaryService;
use App\Http\Requests\StoreMenuRequest;
use App\Http\Requests\UpdateMenuRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Menu::with(['creator' => function($q) {
                // Charger la relation creator même si l'utilisateur n'existe plus
                $q->withDefault(['name' => 'Utilisateur supprimé']);
            }]);
            
            // Si c'est un cuisinier accédant à /my-menus, filtrer par ses menus
            if ($request->user()->role === 'cuisinier') {
                $query->where('created_by', $request->user()->id);
            }
            
            // Filtre par statut si fourni (ne pas filtrer si vide)
            if ($request->has('status') && $request->input('status') !== '') {
                $query->where('status', $request->input('status'));
            }
            
            // Filtre par créateur si fourni
            if ($request->has('created_by')) {
                $query->where('created_by', $request->input('created_by'));
            }
            
            // Recherche par titre si fournie
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where('title', 'like', "%{$search}%");
            }
            
            // Si recent est demandé, retourner les 10 plus récents
            if ($request->query('recent')) {
                return $query->orderBy('created_at', 'desc')->take(10)->get();
            }
            
            // Pagination par défaut
            $perPage = min(max($request->input('per_page', 15), 1), 100);
            return $query->orderBy('created_at', 'desc')->paginate($perPage);
        } catch (\Exception $e) {
            Log::error('Erreur MenuController@index: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Erreur lors de la récupération des menus',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    /**
     * Menus récents approuvés (public, sans auth).
     * Pour dashboard, prévisualisation, etc.
     */
    public function publicRecent(Request $request)
    {
        try {
            $limit = min((int) ($request->query('limit', 10)), 50);
            return Menu::where('status', 'approved')
                ->with(['creator' => fn ($q) => $q->withDefault(['name' => '—'])])
                ->orderBy('created_at', 'desc')
                ->take($limit)
                ->get();
        } catch (\Exception $e) {
            Log::error('MenuController@publicRecent: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la récupération des menus',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne',
            ], 500);
        }
    }

    /**
     * Liste des menus visibles par les clients (statut approved uniquement).
     * Utilisé par la page /client/menus. Public si appelé via /menus/public/browse.
     */
    public function browse(Request $request)
    {
        try {
            $query = Menu::where('status', 'approved');

            if ($request->filled('search')) {
                $query->where('title', 'like', '%' . $request->input('search') . '%');
            }
            if ($request->filled('status') && $request->input('status') !== 'all') {
                $query->where('status', $request->input('status'));
            }

            $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
            return $query->orderBy('created_at', 'desc')->paginate($perPage);
        } catch (\Exception $e) {
            Log::error('MenuController@browse: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la récupération des menus',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    public function store(StoreMenuRequest $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            // Seuls les cuisiniers et admins peuvent créer des menus
            if ($user->role !== 'cuisinier' && $user->role !== 'admin') {
                return response()->json([
                    'message' => 'Accès refusé. Seuls les cuisiniers peuvent créer des menus',
                    'current_role' => $user->role
                ], 403);
            }

            $data = $request->validated();
            
            $data['created_by'] = $user->id;
            $data['currency'] = $data['currency'] ?? 'USD';
            
            // Cuisinier crée toujours en pending, admin peut choisir
            if ($user->role === 'cuisinier') {
                $data['status'] = 'pending';
            } else {
                $data['status'] = $data['status'] ?? 'draft';
            }
            
            // Gestion de l'upload d'image si un fichier est fourni
            if ($request->hasFile('image_file')) {
                $imageUrl = $this->uploadImage($request->file('image_file'));
                $data['image'] = $imageUrl;
            }
            
            $menu = Menu::create($data);
            Log::info('Menu created', ['user_id' => $user->id, 'menu_id' => $menu->id, 'role' => $user->role]);
            
            return response()->json($menu->load('creator'), 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('MenuController@store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la création du menu',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    public function show(Request $request, Menu $menu)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            // Client : accès uniquement aux menus approuvés (pour la page de commande)
            if ($user->role === 'client') {
                if ($menu->status !== 'approved') {
                    return response()->json(['message' => 'Menu non disponible.'], 403);
                }
                return response()->json($menu->load('creator'));
            }
            
            // Admin peut voir tous les menus
            if ($user->role === 'admin') {
                return response()->json($menu->load('creator'));
            }
            
            // Cuisinier peut voir uniquement ses propres menus
            if ($user->role === 'cuisinier') {
                if ((int) $menu->created_by !== (int) $user->id) {
                    return response()->json(['message' => 'Non autorisé à voir ce menu.'], 403);
                }
                return response()->json($menu->load('creator'));
            }

            return response()->json(['message' => 'Non autorisé à voir ce menu.'], 403);
        } catch (\Exception $e) {
            Log::error('MenuController@show error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la récupération du menu',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    public function update(UpdateMenuRequest $request, Menu $menu)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            // Seuls les admins et le propriétaire can can modifier un menu
            if ($user->role !== 'admin' && (int) $menu->created_by !== (int) $user->id) {
                return response()->json([
                    'message' => 'Non autorisé à modifier ce menu',
                    'current_role' => $user->role
                ], 403);
            }

            $data = $request->validated();
            
            // Gestion de l'upload d'image si un fichier est fourni
            if ($request->hasFile('image_file')) {
                $imageUrl = $this->uploadImage($request->file('image_file'));
                $data['image'] = $imageUrl;
            }
            
            $menu->update($data);
            Log::info('Menu updated', ['user_id' => $user->id, 'menu_id' => $menu->id, 'role' => $user->role]);
            
            return response()->json($menu->load('creator'));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('MenuController@update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du menu',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    public function destroy(Request $request, Menu $menu)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            // Seuls les admins et le propriétaire peuvent supprimer un menu
            if ($user->role !== 'admin' && (int) $menu->created_by !== (int) $user->id) {
                return response()->json([
                    'message' => 'Non autorisé à supprimer ce menu',
                    'current_role' => $user->role
                ], 403);
            }

            $menuId = $menu->id;
            $menu->delete();
            Log::info('Menu deleted', ['user_id' => $user->id, 'menu_id' => $menuId, 'role' => $user->role]);
            
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('MenuController@destroy error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la suppression du menu',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    /**
     * Upload image vers Cloudinary
     */
    private function uploadImage($file)
    {
        try {
            $res = CloudinaryService::uploadImage($file, 'menus');
            if (is_array($res)) {
                return $res['url'] ?? ($res['secure_url'] ?? '');
            }
            return (string) $res;
        } catch (\Exception $e) {
            Log::error('Upload image error: ' . $e->getMessage());
            throw $e;
        }
    }
}
