<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Vérifie un id_token Google (tokeninfo) et retourne un utilisateur existant ou un nouveau client.
 */
class GoogleAuthService
{
    public function authenticateFromIdToken(string $idToken): User
    {
        $clientId = config('services.google.client_id');
        if (! $clientId) {
            throw ValidationException::withMessages([
                'id_token' => ['Connexion Google non configurée sur le serveur.'],
            ]);
        }

        $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $idToken,
        ]);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'id_token' => ['Jeton Google invalide ou expiré.'],
            ]);
        }

        $payload = $response->json();
        if (($payload['aud'] ?? '') !== $clientId) {
            throw ValidationException::withMessages([
                'id_token' => ['Jeton Google non valide pour cette application.'],
            ]);
        }

        $emailVerified = $payload['email_verified'] ?? false;
        if ($emailVerified !== true && $emailVerified !== 'true') {
            throw ValidationException::withMessages([
                'email' => ['Votre adresse Google n’est pas vérifiée.'],
            ]);
        }

        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        if ($email === '') {
            throw ValidationException::withMessages([
                'email' => ['Impossible de récupérer l’e-mail Google.'],
            ]);
        }

        $name = trim((string) ($payload['name'] ?? $payload['given_name'] ?? 'Client'));
        $picture = isset($payload['picture']) ? (string) $payload['picture'] : null;

        $user = User::where('email', $email)->first();

        if ($user) {
            $dirty = false;
            if ($picture && empty($user->avatar_url)) {
                $user->avatar_url = $picture;
                $dirty = true;
            }
            if ($user->email_verified_at === null) {
                $user->email_verified_at = now();
                $dirty = true;
            }
            if ($dirty) {
                $user->save();
            }

            return $user;
        }

        return User::create([
            'name' => $name !== '' ? $name : 'Client',
            'email' => $email,
            'password' => Str::password(32),
            'role' => 'client',
            'phone' => null,
            'avatar_url' => $picture,
            'email_verified_at' => now(),
        ]);
    }
}
