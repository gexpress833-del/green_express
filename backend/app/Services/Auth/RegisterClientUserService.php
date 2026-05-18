<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Services\PhoneRDCService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Création d’un compte client (particulier) après validation HTTP.
 */
class RegisterClientUserService
{
    /**
     * @param  array{name: string, email: string, password: string, phone: string}  $data
     */
    public function create(array $data): User
    {
        $phoneNorm = PhoneRDCService::formatPhoneRDC($data['phone']);
        if (! PhoneRDCService::isValidPhoneRDC($phoneNorm)) {
            throw ValidationException::withMessages([
                'phone' => ['Numéro de téléphone invalide (RDC : 9 chiffres après l’indicatif 243).'],
            ]);
        }
        if (User::where('phone', $phoneNorm)->exists()) {
            throw ValidationException::withMessages([
                'phone' => ['Ce numéro est déjà associé à un compte.'],
            ]);
        }

        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'client',
            'phone' => $phoneNorm,
        ]);
    }
}
