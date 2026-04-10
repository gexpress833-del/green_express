<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\PhoneRDCService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:512'], // URL ou chaîne vide pour supprimer
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);

        $updates = ['name' => $data['name']];

        if (array_key_exists('email', $data)) {
            $updates['email'] = $data['email'];
        }

        if (array_key_exists('phone', $data)) {
            $raw = $data['phone'];
            if ($raw === null || trim((string) $raw) === '') {
                $updates['phone'] = null;
            } else {
                $norm = PhoneRDCService::formatPhoneRDC((string) $raw);
                if (! PhoneRDCService::isValidPhoneRDC($norm)) {
                    throw ValidationException::withMessages([
                        'phone' => ['Numéro de téléphone invalide (RDC : 9 chiffres après l’indicatif 243).'],
                    ]);
                }
                if (User::where('phone', $norm)->where('id', '!=', $user->id)->exists()) {
                    throw ValidationException::withMessages([
                        'phone' => ['Ce numéro est déjà associé à un compte.'],
                    ]);
                }
                $updates['phone'] = $norm;
            }
        }

        if (array_key_exists('avatar_url', $data)) {
            $newAvatarUrl = $data['avatar_url'] ?: null;
            $oldAvatarUrl = $user->avatar_url;

            // Supprimer l'ancienne image Cloudinary si elle change ou est effacée
            if (
                $oldAvatarUrl &&
                $oldAvatarUrl !== $newAvatarUrl &&
                str_contains($oldAvatarUrl, 'cloudinary.com')
            ) {
                try {
                    CloudinaryService::deleteImage($oldAvatarUrl);
                } catch (\Exception $e) {
                    Log::warning('ProfileController: impossible de supprimer l\'ancienne image Cloudinary', [
                        'url'   => $oldAvatarUrl,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $updates['avatar_url'] = $newAvatarUrl;
        }

        $user->update($updates);

        return response()->json([
            'user' => $user->fresh(),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($data['current_password'], (string) $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($data['password']),
        ]);

        return response()->json([
            'message' => 'Mot de passe mis à jour.',
        ]);
    }
}
