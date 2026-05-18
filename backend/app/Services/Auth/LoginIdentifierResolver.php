<?php

namespace App\Services\Auth;

use App\Models\Profile;
use App\Models\User;
use App\Services\PhoneRDCService;

/**
 * Résout un utilisateur à partir d’un identifiant de connexion (e-mail ou téléphone RDC).
 * Partagé entre l’API (Sanctum, guard `api`) et le frontend Blade/Livewire (guard `web`).
 */
class LoginIdentifierResolver
{
    public function resolve(string $identifier): ?User
    {
        $identifier = trim($identifier);
        if ($identifier === '') {
            return null;
        }

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            return User::where('email', $identifier)->first();
        }

        $norm = PhoneRDCService::formatPhoneRDC($identifier);
        if ($norm === '') {
            return null;
        }

        $byUser = User::where('phone', $norm)->first();
        if ($byUser) {
            return $byUser;
        }

        foreach (Profile::query()->whereNotNull('phone')->cursor() as $profile) {
            if (PhoneRDCService::formatPhoneRDC((string) $profile->phone) === $norm) {
                return User::find($profile->user_id);
            }
        }

        return null;
    }
}
