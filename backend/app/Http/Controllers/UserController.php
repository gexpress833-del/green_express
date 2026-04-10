<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Traits\AdminRequiresPermission;
use App\Http\Traits\RoleAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    use AdminRequiresPermission;
    use RoleAccess;

    /**
     * Create a new user (admin only). Only administrators may create users and assign roles.
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            if ($r = $this->adminRequires($request, 'users.create')) {
                return $r;
            }

            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'password' => 'required|string|min:6',
                'role' => 'required|string|in:admin,cuisinier,client,livreur,verificateur,agent,entreprise,secretaire',
            ]);

            $newUser = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
            ]);

            Log::info('User created by admin', ['admin_id' => $user->id, 'new_user_id' => $newUser->id]);

            return response()->json($newUser, 201);
        } catch (\Exception $e) {
            Log::error('UserController@store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la création de l\'utilisateur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            if ($r = $this->adminRequires($request, 'users.list')) {
                return $r;
            }

            // Pagination pour éviter de charger tous les utilisateurs
            $perPage = $request->input('per_page', 15);
            $perPage = min(max($perPage, 1), 100); // Limiter entre 1 et 100
            
            $query = User::query();
            
            // Filtrer par rôle si fourni
            if ($request->has('role')) {
                $query->where('role', $request->input('role'));
            }
            
            // Recherche par nom ou email si fourni
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }
            
            // Exclure les mots de passe et tokens sensibles
            $users = $query->paginate($perPage);
            
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('UserController@index error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    // Admin-only: update a user's role
    public function updateRole(Request $request, User $user)
    {
        try {
            $admin = $request->user();
            if (!$admin) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            if ($r = $this->adminRequires($request, 'users.assign-role')) {
                return $r;
            }

            $data = $request->validate([
                'role' => 'required|string|in:admin,cuisinier,client,livreur,verificateur,agent,entreprise,secretaire'
            ]);

            $oldRole = $user->role;
            $user->role = $data['role'];
            $user->save();

            Log::info('User role updated', [
                'admin_id' => $admin->id,
                'user_id' => $user->id,
                'old_role' => $oldRole,
                'new_role' => $data['role']
            ]);

            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('UserController@updateRole error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la modification du rôle',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    /**
     * Supprimer un utilisateur (admin only). Impossible de supprimer son propre compte.
     */
    public function destroy(Request $request, User $user)
    {
        try {
            $admin = $request->user();
            if (!$admin) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }
            if ($r = $this->adminRequires($request, 'users.delete')) {
                return $r;
            }
            if ($user->id === $admin->id) {
                return response()->json([
                    'message' => 'Vous ne pouvez pas supprimer votre propre compte',
                ], 403);
            }

            $user->delete();
            Log::info('User deleted by admin', ['admin_id' => $admin->id, 'deleted_user_id' => $user->id]);
            return response()->json(['message' => 'Utilisateur supprimé'], 200);
        } catch (\Exception $e) {
            Log::error('UserController@destroy error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }
}
