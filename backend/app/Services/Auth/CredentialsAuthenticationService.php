<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * Vérifie identifiant (e-mail / téléphone RDC) + mot de passe.
 * Réutilisable par POST /api/login et par Livewire (guard web).
 */
class CredentialsAuthenticationService
{
    public function __construct(
        private LoginIdentifierResolver $resolver,
    ) {}

    /**
     * Retourne l’utilisateur si les identifiants sont valides, sinon null.
     */
    public function attempt(string $identifier, string $plainPassword): ?User
    {
        $identifier = trim($identifier);
        $plainPassword = (string) $plainPassword;
        if ($identifier === '' || $plainPassword === '') {
            return null;
        }

        $user = $this->resolver->resolve($identifier);
        if (! $user || ! Hash::check($plainPassword, (string) $user->getAuthPassword())) {
            return null;
        }

        return $user;
    }
}
