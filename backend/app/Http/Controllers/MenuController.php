<?php

namespace App\Http\Controllers;

use App\Http\Traits\RoleAccess;
use App\Models\Menu;
use App\Services\CloudinaryService;
use App\Http\Requests\StoreMenuRequest;
use App\Http\Requests\UpdateMenuRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MenuController extends Controller
{
    use RoleAccess;

    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (! $user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }
            $canList = $user->safeHasPermissionTo('menus.list');
            $canListOwn = $user->safeHasPermissionTo('menus.list-own');

            if ($canList === null && $canListOwn === null) {
                return response()->json([
                    'message' => 'Permissions menus manquantes. Exécutez : php artisan db:seed --class=RolesAndPermissionsSeeder',
                ], 503);
            }

            if ($canList !== true && $canListOwn !== true) {
                return response()->json(['message' => 'Accès refusé'], 403);
            }

            $query = Menu::with(['creator' => function($q) {
                // Charger la relation creator même si l'utilisateur n'existe plus
                $q->withDefault(['name' => 'Utilisateur supprimé']);
            }]);

            if ($canListOwn === true && $canList !== true) {
                $query->where('created_by', $user->id);
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

            $canCreate = $user->safeHasPermissionTo('menus.create');
            if ($canCreate === null) {
                return response()->json([
                    'message' => 'Permission menus.create absente. Exécutez : php artisan db:seed --class=RolesAndPermissionsSeeder',
                ], 503);
            }
            if ($canCreate !== true) {
                return response()->json([
                    'message' => 'Accès refusé. Permission menus.create requise',
                    'current_role' => $user->role,
                ], 403);
            }

            $data = $request->validated();

            $data['created_by'] = $user->id;
            $data['currency'] = $data['currency'] ?? 'USD';

            $canEdit = $user->safeHasPermissionTo('menus.edit');
            $canEditOwn = $user->safeHasPermissionTo('menus.edit-own');
            if ($canEdit === null || $canEditOwn === null) {
                return response()->json([
                    'message' => 'Permissions menus éditoriales manquantes. Exécutez : php artisan db:seed --class=RolesAndPermissionsSeeder',
                ], 503);
            }

            if ($canEditOwn === true && $canEdit !== true) {
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

            $viewApproved = $user->safeHasPermissionTo('menus.view-approved');
            $viewAll = $user->safeHasPermissionTo('menus.view');
            $viewOwn = $user->safeHasPermissionTo('menus.view-own');
            if ($viewApproved === null || $viewAll === null || $viewOwn === null) {
                return response()->json([
                    'message' => 'Permissions menus (lecture) manquantes. Exécutez : php artisan db:seed --class=RolesAndPermissionsSeeder',
                ], 503);
            }

            if ($viewApproved === true) {
                if ($menu->status !== 'approved') {
                    return response()->json(['message' => 'Menu non disponible.'], 403);
                }
                return response()->json($menu->load('creator'));
            }

            if ($viewAll === true) {
                return response()->json($menu->load('creator'));
            }

            if ($viewOwn === true && (int) $menu->created_by === (int) $user->id) {
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

            $permEdit = $user->safeHasPermissionTo('menus.edit');
            $permEditOwn = $user->safeHasPermissionTo('menus.edit-own');
            if ($permEdit === null || $permEditOwn === null) {
                return response()->json([
                    'message' => 'Permissions menus (édition) manquantes. Exécutez : php artisan db:seed --class=RolesAndPermissionsSeeder',
                ], 503);
            }

            $canEditAll = $permEdit === true;
            $canEditOwn = $permEditOwn === true && (int) $menu->created_by === (int) $user->id;
            if (! $canEditAll && ! $canEditOwn) {
                return response()->json([
                    'message' => 'Non autorisé à modifier ce menu',
                    'current_role' => $user->role,
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

            $permDel = $user->safeHasPermissionTo('menus.delete');
            $permDelOwn = $user->safeHasPermissionTo('menus.delete-own');
            if ($permDel === null || $permDelOwn === null) {
                return response()->json([
                    'message' => 'Permissions menus (suppression) manquantes. Exécutez : php artisan db:seed --class=RolesAndPermissionsSeeder',
                ], 503);
            }

            $canDeleteAll = $permDel === true;
            $canDeleteOwn = $permDelOwn === true && (int) $menu->created_by === (int) $user->id;
            if (! $canDeleteAll && ! $canDeleteOwn) {
                return response()->json([
                    'message' => 'Non autorisé à supprimer ce menu',
                    'current_role' => $user->role,
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
