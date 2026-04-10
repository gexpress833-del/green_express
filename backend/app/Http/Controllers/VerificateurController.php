<?php

namespace App\Http\Controllers;

use App\Models\PromotionClaim;
use App\Http\Traits\RoleAccess;
use Illuminate\Http\Request;

class VerificateurController extends Controller
{
    use RoleAccess;

    public function stats(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            // Seuls les vérificateurs et admins peuvent voir ces stats
            if ($user->role !== 'verificateur' && $user->role !== 'admin') {
                return response()->json([
                    'message' => 'Accès refusé. Rôle vérificateur ou admin requis',
                    'current_role' => $user->role
                ], 403);
            }

            $validated = PromotionClaim::where('status', 'validated')->count();
            $pending = PromotionClaim::where('status', 'claimed')->count();
            $lastClaim = PromotionClaim::where('status', 'validated')->orderBy('validated_at', 'desc')->first();
            $last = $lastClaim && $lastClaim->validated_at
                ? $lastClaim->validated_at->diffForHumans()
                : '—';

            return response()->json([
                'validated' => $validated,
                'pending' => $pending,
                'last' => $last,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    /**
     * Valider un ticket de promotion
     * Le vérificateur saisit le code du ticket généré par le client (GXT-XXXXXXXX).
     */
    public function validatePromotionTicket(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            // Seuls les vérificateurs et admins peuvent valider
            if ($user->role !== 'verificateur' && $user->role !== 'admin') {
                return response()->json([
                    'message' => 'Accès refusé. Rôle vérificateur ou admin requis',
                    'current_role' => $user->role
                ], 403);
            }

            $data = $request->validate([
                'ticket_code' => 'required|string|max:32',
            ]);

            $code = strtoupper(trim($data['ticket_code']));
            $claim = PromotionClaim::with(['promotion.menu', 'user'])->where('ticket_code', $code)->first();

            if (!$claim) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Ticket introuvable. Vérifiez le code.',
                ], 404);
            }

            if ($claim->status === 'validated') {
                return response()->json([
                    'valid' => true,
                    'message' => 'Ce ticket a déjà été validé.',
                    'claim' => $claim->only(['id', 'ticket_code', 'validated_at']),
                ], 200);
            }

            $claim->update([
                'status' => 'validated',
                'validated_at' => now(),
            ]);

            $promoTitle = $claim->promotion
                ? ($claim->promotion->title ?? $claim->promotion->menu?->title ?? '—')
                : '—';

            return response()->json([
                'valid' => true,
                'message' => 'Ticket validé avec succès.',
                'claim' => [
                    'id' => $claim->id,
                    'ticket_code' => $claim->ticket_code,
                    'promotion' => $promoTitle,
                    'user_id' => $claim->user_id,
                    'validated_at' => $claim->validated_at?->toIso8601String(),
                ],
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la validation du ticket',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }

    /**
     * Historique des validations (tickets validés) — pour le rôle vérificateur.
     */
    public function history(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            if ($user->role !== 'verificateur' && $user->role !== 'admin') {
                return response()->json([
                    'message' => 'Accès refusé. Rôle vérificateur ou admin requis',
                    'current_role' => $user->role
                ], 403);
            }

            $perPage = max(1, min(50, (int) $request->get('per_page', 15)));
            $claims = PromotionClaim::with(['promotion.menu', 'user'])
                ->where('status', 'validated')
                ->orderBy('validated_at', 'desc')
                ->paginate($perPage);

            $items = $claims->getCollection()->map(function ($claim) {
                $promoTitle = $claim->promotion
                    ? ($claim->promotion->title ?? $claim->promotion->menu?->title ?? '—')
                    : '—';
                return [
                    'id' => $claim->id,
                    'ticket_code' => $claim->ticket_code,
                    'promotion' => $promoTitle,
                    'user_id' => $claim->user_id,
                    'user_name' => $claim->user ? ($claim->user->name ?? '—') : '—',
                    'validated_at' => $claim->validated_at?->toIso8601String(),
                ];
            });

            return response()->json([
                'data' => $items,
                'current_page' => $claims->currentPage(),
                'last_page' => $claims->lastPage(),
                'per_page' => $claims->perPage(),
                'total' => $claims->total(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du chargement de l\'historique',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }
}
