<?php

namespace App\Http\Controllers;

use App\Services\Auth\CredentialsAuthenticationService;
use App\Services\Auth\RegisterClientUserService;
use App\Services\Auth\RegisterCompanyApplicationService;
use App\Services\Auth\UserPermissionPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Authentification SPA avec Laravel Sanctum (session + cookies httpOnly).
 * Pas de token en localStorage : la session est portée par les cookies.
 * La logique métier partagée avec le front Blade/Livewire vit dans app/Services/Auth.
 */
class AuthController extends Controller
{
    public function __construct(
        private UserPermissionPresenter $userPermissionPresenter,
        private CredentialsAuthenticationService $credentialsAuthentication,
        private RegisterClientUserService $registerClientUser,
        private RegisterCompanyApplicationService $registerCompanyApplication,
    ) {}

    /**
     * Inscription : crée l'utilisateur (rôle client), le connecte en session, retourne l'utilisateur.
     */
    public function register(Request $request)
    {
        $data = $request->validate(
            [
                'name' => 'required|string',
                'email' => 'required|email|unique:users',
                'password' => 'required|min:8',
                'phone' => 'required|string|max:30',
            ],
            [
                'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
                'email.email' => 'Veuillez entrer une adresse e-mail valide.',
                'password.min' => 'Le mot de passe doit contenir au moins :min caractères.',
            ]
        );

        $user = $this->registerClientUser->create($data);

        // Connexion automatique après inscription (session Sanctum + guard api)
        Auth::guard('api')->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json(['user' => $this->userPermissionPresenter->toArray($user->fresh())], 201);
    }

    /**
     * Inscription entreprise (B2B) : crée user + company, pas de connexion auto.
     */
    public function registerCompany(Request $request)
    {
        Log::info('🔵 [registerCompany] Requête reçue', $request->all());

        $data = $request->validate(
            [
                'contact_name' => 'required|string',
                'contact_email' => 'required|email|unique:users,email',
                'contact_password' => 'required|min:8',
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
            ],
            [
                'contact_email.unique' => 'Cette adresse e-mail est déjà utilisée pour un compte. Utilisez un autre e-mail ou connectez-vous avec ce compte.',
                'contact_email.email' => 'Veuillez entrer une adresse e-mail valide.',
                'contact_password.min' => 'Le mot de passe doit contenir au moins :min caractères.',
            ]
        );

        if (count($data['employees']) != $data['employee_count']) {
            return response()->json([
                'success' => false,
                'message' => 'Le nombre de noms d\'employés doit être égal au nombre d\'agents indiqué.',
            ], 422);
        }

        try {
            $user = $this->registerCompanyApplication->create($data);

            return response()->json([
                'success' => true,
                'message' => 'Demande d\'accès B2B envoyée. Un administrateur examinera votre demande.',
                'user' => $this->userPermissionPresenter->toArray($user),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Connexion : session régénérée, cookie de session envoyé au frontend (httpOnly).
     * Identifiant : e-mail OU numéro de téléphone (corps : `login` ou ancien champ `email`).
     */
    public function login(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $identifier = trim((string) ($request->input('login') ?? $request->input('email') ?? ''));
        if ($identifier === '') {
            throw ValidationException::withMessages([
                'login' => ['Identifiant (e-mail ou numéro de téléphone) requis.'],
            ]);
        }

        $password = (string) $request->input('password');
        $user = $this->credentialsAuthentication->attempt($identifier, $password);

        if (! $user) {
            throw ValidationException::withMessages([
                'login' => ['Identifiants incorrects. Vérifiez l’e-mail ou le numéro et le mot de passe.'],
            ]);
        }

        Auth::guard('api')->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json(['user' => $this->userPermissionPresenter->toArray($request->user('api'))]);
    }

    /**
     * Utilisateur connecté (convention Sanctum /api/user et alias /api/me).
     * Public : renvoie 200 avec l'utilisateur ou null pour éviter un 401 en console quand non connecté.
     * Utilise le guard 'api' pour cohérence avec login (session Sanctum).
     */
    public function user(Request $request)
    {
        $user = $request->user('api');

        return response()->json($this->userPermissionPresenter->toNullableArray($user));
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
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out']);
    }
}
