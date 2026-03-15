<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Order;
use App\Models\User;
use App\Http\Traits\RoleAccess;
use Illuminate\Http\Request;

class EntrepriseController extends Controller
{
    use RoleAccess;

    /**
     * Retourne l'entreprise dont l'utilisateur connecté est le contact (rôle entreprise).
     * Utilisé par le frontend pour appeler les API /api/companies/{id}/...
     */
    public function company(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }
        if ($user->role !== 'entreprise') {
            return response()->json([
                'message' => 'Accès refusé. Rôle entreprise requis.',
                'current_role' => $user->role,
            ], 403);
        }

        $company = Company::where('contact_user_id', $user->id)->first();
        if (!$company) {
            return response()->json([
                'message' => 'Aucune entreprise associée à votre compte. Demande en attente de validation par l\'administrateur.',
                'company' => null,
            ]);
        }

        return response()->json([
            'company' => $company->load(['contactUser:id,name,email']),
        ]);
    }

    /**
     * Statistiques tableau de bord entreprise.
     * Basées sur la Company du contact (rôle entreprise) ou sur user_id/company_id pour admin.
     */
    public function stats(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            if ($user->role !== 'entreprise' && $user->role !== 'admin') {
                return response()->json([
                    'message' => 'Accès refusé. Rôle entreprise ou admin requis',
                    'current_role' => $user->role,
                ], 403);
            }

            // Rôle entreprise : stats de la company dont il est le contact
            if ($user->role === 'entreprise') {
                $company = Company::where('contact_user_id', $user->id)->first();
                if (!$company) {
                    return response()->json([
                        'employees' => 0,
                        'orders' => 0,
                        'budget' => 0,
                        'company_pending' => true,
                    ]);
                }
                // Effectif pris en compte uniquement après validation admin (liste officielle)
                $employees = $company->status === 'active'
                    ? (count(is_array($company->pending_employees) ? $company->pending_employees : []) ?: (int) ($company->employee_count ?? $company->employees()->count()))
                    : 0;
                $orders = Order::where('company_id', $company->id)->count();
                $budget = (float) ($company->monthly_budget ?? 0);
                $budgetOrders = Order::where('company_id', $company->id)->sum('total_amount');
                if ($budget <= 0 && $budgetOrders > 0) {
                    $budget = (float) $budgetOrders;
                }
                return response()->json([
                    'employees' => $employees,
                    'orders' => $orders,
                    'budget' => $budget,
                    'company_pending' => $company->status !== 'active',
                ]);
            }

            // Admin : optionnel user_id ou son propre contexte (legacy)
            $userId = $request->input('user_id', $user->id);
            $company = Company::where('contact_user_id', $userId)->first();
            if ($company) {
                $employees = $company->status === 'active'
                    ? (count(is_array($company->pending_employees) ? $company->pending_employees : []) ?: (int) ($company->employee_count ?? $company->employees()->count()))
                    : 0;
                $orders = Order::where('company_id', $company->id)->count();
                $budget = (float) ($company->monthly_budget ?? Order::where('company_id', $company->id)->sum('total_amount'));
                return response()->json([
                    'employees' => $employees,
                    'orders' => $orders,
                    'budget' => $budget,
                ]);
            }

            // Fallback admin sans company (ancienne logique)
            $employees = User::whereHas('orders', function ($q) use ($userId) {
                $q->where('company_id', $userId);
            })->distinct()->count();
            $orders = Order::where('company_id', $userId)->count();
            $budget = (float) Order::where('company_id', $userId)->sum('total_amount');

            return response()->json([
                'employees' => $employees,
                'orders' => $orders,
                'budget' => $budget,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne',
            ], 500);
        }
    }

    /**
     * Liste des commandes de l'entreprise du contact (rôle entreprise).
     */
    public function orders(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }
        if ($user->role !== 'entreprise') {
            return response()->json(['message' => 'Accès refusé. Rôle entreprise requis.'], 403);
        }

        $company = Company::where('contact_user_id', $user->id)->first();
        if (!$company) {
            return response()->json([
                'message' => 'Aucune entreprise associée. En attente de validation.',
                'data' => [],
            ], 200);
        }

        $orders = Order::with(['items.menu', 'user:id,name,email'])
            ->where('company_id', $company->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($orders);
    }
}
