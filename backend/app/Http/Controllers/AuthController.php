<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

/**
 * Authentification SPA avec Laravel Sanctum (session + cookies httpOnly).
 * Pas de token en localStorage : la session est portée par les cookies.
 */
class AuthController extends Controller
{
    /**
     * Inscription : crée l'utilisateur (rôle client), le connecte en session, retourne l'utilisateur.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'client',
        ]);

        // Connexion automatique après inscription (session Sanctum + guard api)
        Auth::guard('api')->login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $user], 201);
    }

    /**
     * Inscription entreprise (B2B) : crée user + company, pas de connexion auto.
     */
    public function registerCompany(Request $request)
    {
        Log::info('🔵 [registerCompany] Requête reçue', $request->all());

        $data = $request->validate([
            'contact_name' => 'required|string',
            'contact_email' => 'required|email|unique:users,email',
            'contact_password' => 'required|min:6',
            'company_name' => 'required|string|max:255',
            'institution_type' => 'required|in:etat,hopital,ecole,universite,privee',
            'company_phone' => 'required|string|max:20',
            'company_address' => 'required|string',
            'employee_count' => 'required|integer|min:1',
            'employees' => 'required|array|min:1',
            'employees.*.full_name' => 'required|string|max:255',
            'employees.*.matricule' => 'nullable|string|max:50',
            'employees.*.function' => 'nullable|string|max:255',
            'employees.*.phone' => 'nullable|string|max:30',
        ]);

        if (count($data['employees']) != $data['employee_count']) {
            return response()->json([
                'success' => false,
                'message' => 'Le nombre de noms d\'employés doit être égal au nombre d\'agents indiqué.',
            ], 422);
        }

        try {
            $user = User::create([
                'name' => $data['contact_name'],
                'email' => $data['contact_email'],
                'password' => Hash::make($data['contact_password']),
                'role' => 'entreprise',
            ]);

            $slug = Str::slug($data['company_name']);
            Company::create([
                'name' => $data['company_name'],
                'slug' => $slug,
                'email' => $data['contact_email'],
                'phone' => $data['company_phone'],
                'address' => $data['company_address'],
                'institution_type' => $data['institution_type'],
                'employee_count' => $data['employee_count'],
                'pending_employees' => $data['employees'],
                'status' => 'pending',
                'contact_user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Demande d\'accès B2B envoyée. Un administrateur examinera votre demande.',
                'user' => $user,
            ], 201);
        } catch (\Exception $e) {
            Log::error('❌ [registerCompany] ' . $e->getMessage(), ['exception' => $e]);
            if (isset($user)) {
                $user->delete();
            }
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Connexion : session régénérée, cookie de session envoyé au frontend (httpOnly).
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (! Auth::guard('api')->attempt($data)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $request->session()->regenerate();
        $user = $request->user('api');

        return response()->json(['user' => $user]);
    }

    /**
     * Utilisateur connecté (convention Sanctum /api/user et alias /api/me).
     * Public : renvoie 200 avec l'utilisateur ou null pour éviter un 401 en console quand non connecté.
     * Utilise le guard 'api' pour cohérence avec login (session Sanctum).
     */
    public function user(Request $request)
    {
        $user = $request->user('api');
        if (! $user) {
            return response()->json(null, 200);
        }
        return response()->json($user);
    }

    /** Alias pour compatibilité existante */
    public function me(Request $request)
    {
        return $this->user($request);
    }

    /**
     * Déconnexion : invalidation de la session.
     */
    public function logout(Request $request)
    {
        Auth::guard('api')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    }
}
