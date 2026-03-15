<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    /**
     * Liste des plans actifs (public, sans auth) pour la page d'accueil.
     */
    public function publicIndex()
    {
        return SubscriptionPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    /**
     * Liste des plans (admin: tous, client/public: actifs uniquement).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = SubscriptionPlan::query()->orderBy('sort_order')->orderBy('id');

        if ($user?->role !== 'admin') {
            $query->where('is_active', true);
        }

        return $query->get();
    }

    /**
     * Détail d'un plan (admin ou client pour souscrire).
     */
    public function show(SubscriptionPlan $subscriptionPlan)
    {
        return $subscriptionPlan;
    }

    /**
     * Créer un plan (admin uniquement).
     */
    public function store(Request $request)
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price_week' => 'required|numeric|min:0',
            'price_month' => 'required|numeric|min:0',
            'currency' => 'nullable|string|in:CDF',
            'days_per_week' => 'nullable|integer|min:1|max:7',
            'days_per_month' => 'nullable|integer|min:1|max:31',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $data['currency'] = $data['currency'] ?? 'CDF';
        $data['days_per_week'] = $data['days_per_week'] ?? 5;
        $data['days_per_month'] = $data['days_per_month'] ?? 20;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $plan = SubscriptionPlan::create($data);
        return response()->json($plan, 201);
    }

    /**
     * Modifier un plan (admin uniquement).
     */
    public function update(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price_week' => 'sometimes|numeric|min:0',
            'price_month' => 'sometimes|numeric|min:0',
            'currency' => 'nullable|string|in:CDF',
            'days_per_week' => 'nullable|integer|min:1|max:7',
            'days_per_month' => 'nullable|integer|min:1|max:31',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $subscriptionPlan->update($data);
        return response()->json($subscriptionPlan->fresh());
    }

    /**
     * Supprimer un plan (admin uniquement).
     */
    public function destroy(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $subscriptionPlan->delete();
        return response()->json(['message' => 'Plan supprimé.'], 200);
    }
}
