<?php

namespace App\Http\Controllers;

use App\Models\FcmToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FcmTokenController extends Controller
{
    /**
     * Enregistre ou rafraîchit un jeton FCM pour l'utilisateur connecté.
     *
     * POST /api/fcm/token
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string', 'max:500'],
            'platform' => ['nullable', 'string', 'max:50'],
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Met à jour ou crée le token FCM
        $fcmToken = FcmToken::updateOrCreate(
            ['token' => $request->input('token')],
            [
                'user_id' => $user->id,
                'platform' => $request->input('platform', 'web'),
                'user_agent' => substr($request->userAgent(), 0, 255),
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Token FCM enregistré avec succès.',
            'id' => $fcmToken->id,
        ]);
    }

    /**
     * Supprime un jeton FCM (ex: lors du logout).
     *
     * DELETE /api/fcm/token
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string', 'max:500'],
        ]);

        $deleted = FcmToken::where('token', $request->input('token'))->delete();

        return response()->json([
            'message' => 'Token FCM supprimé.',
            'deleted' => $deleted > 0,
        ]);
    }
}
