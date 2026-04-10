<?php

namespace App\Http\Controllers;

use App\Http\Traits\AdminRequiresPermission;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    use AdminRequiresPermission;

    /**
     * Liste des plans actifs (public, sans auth) pour la page d'accueil.
     */
    public function publicIndex()
    {
        return SubscriptionPlan::with(['items' => fn ($q) => $q->orderBy('sort_order')])
            ->where('is_active', true)
            ->forIndividuals()
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
        $query = SubscriptionPlan::with(['items' => fn ($q) => $q->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->orderBy('id');

        if (! $user || ! $user->canAsAdmin('admin.subscription-plans')) {
            $query->where('is_active', true)->forIndividuals();
        }

        return $query->get();
    }

    /**
     * Détail d'un plan (admin ou client pour souscrire).
     */
    public function show(SubscriptionPlan $subscriptionPlan)
    {
        return $subscriptionPlan->load(['items' => fn ($q) => $q->orderBy('sort_order')]);
    }

    /**
     * Créer un plan (admin uniquement).
     */
    public function store(Request $request)
    {
        if ($r = $this->adminRequires($request, 'admin.subscription-plans')) {
            return $r;
        }

        $data = $this->validatedPlanPayload($request);

        $items = $data['items'] ?? null;
        unset($data['items']);

        $data['currency'] = $data['currency'] ?? 'CDF';
        $data['days_per_week'] = $data['days_per_week'] ?? 5;
        $data['days_per_month'] = $data['days_per_month'] ?? 20;
        // Par défaut : brouillon — l’admin doit publier pour afficher le plan aux clients.
        $data['is_active'] = (bool) ($data['is_active'] ?? false);
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['plan_scope'] = $data['plan_scope'] ?? SubscriptionPlan::SCOPE_BOTH;

        $plan = SubscriptionPlan::create($data);
        if (is_array($items)) {
            $this->syncItems($plan, $items);
        }

        return response()->json($plan->fresh()->load(['items' => fn ($q) => $q->orderBy('sort_order')]), 201);
    }

    /**
     * Modifier un plan (admin uniquement).
     */
    public function update(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        if ($r = $this->adminRequires($request, 'admin.subscription-plans')) {
            return $r;
        }

        $data = $this->validatedPlanPayload($request, true);

        $items = null;
        if (array_key_exists('items', $data)) {
            $items = $data['items'];
            unset($data['items']);
        }

        if (! empty($data)) {
            $subscriptionPlan->update($data);
        }

        if (is_array($items)) {
            $this->syncItems($subscriptionPlan->fresh(), $items);
        }

        return response()->json($subscriptionPlan->fresh()->load(['items' => fn ($q) => $q->orderBy('sort_order')]));
    }

    /**
     * Supprimer un plan (admin uniquement).
     */
    public function destroy(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        if ($r = $this->adminRequires($request, 'admin.subscription-plans')) {
            return $r;
        }

        $subscriptionPlan->delete();

        return response()->json(['message' => 'Plan supprimé.'], 200);
    }

    /**
     * @param  bool  $isUpdate  règles « sometimes » pour la mise à jour
     */
    private function validatedPlanPayload(Request $request, bool $isUpdate = false): array
    {
        $nameRule = $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255';
        $priceWeekRule = $isUpdate ? 'sometimes|required|numeric|min:0' : 'required|numeric|min:0';
        $priceMonthRule = $isUpdate ? 'sometimes|required|numeric|min:0' : 'required|numeric|min:0';

        return $request->validate([
            'name' => $nameRule,
            'description' => 'nullable|string',
            'plan_scope' => 'nullable|string|in:individual,company,both',
            'meal_types' => 'nullable|array',
            'meal_types.*.label' => 'required_with:meal_types|string|max:120',
            'meal_types.*.detail' => 'nullable|string|max:500',
            'meal_types.*.emoji' => 'nullable|string|max:8',
            'highlights' => 'nullable|array',
            'highlights.*' => 'string|max:255',
            'price_week' => $priceWeekRule,
            'price_month' => $priceMonthRule,
            'currency' => 'nullable|string|in:CDF',
            'days_per_week' => 'nullable|integer|min:1|max:7',
            'days_per_month' => 'nullable|integer|min:1|max:31',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'items' => 'nullable|array',
            'items.*.title' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.image' => 'nullable|string|max:2048',
            'items.*.menu_id' => 'nullable|exists:menus,id',
            'items.*.sort_order' => 'nullable|integer|min:0',
            'items.*.meal_slot' => 'nullable|string|max:80',
        ]);
    }

    private function syncItems(SubscriptionPlan $plan, array $items): void
    {
        $plan->items()->delete();
        foreach ($items as $index => $row) {
            $plan->items()->create([
                'menu_id' => isset($row['menu_id']) ? (int) $row['menu_id'] : null,
                'title' => $row['title'],
                'description' => $row['description'] ?? null,
                'image' => $row['image'] ?? null,
                'sort_order' => (int) ($row['sort_order'] ?? $index),
                'meal_slot' => $row['meal_slot'] ?? null,
            ]);
        }
    }
}
