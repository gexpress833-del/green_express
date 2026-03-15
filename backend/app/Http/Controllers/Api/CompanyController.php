<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\RoleAccess;
use App\Models\Company;
use App\Models\CompanySubscription;
use App\Services\CompanyPricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Contrôleur pour la gestion des entreprises (B2B)
 */
class CompanyController extends Controller
{
    use RoleAccess;

    private CompanyPricingService $pricingService;

    public function __construct(CompanyPricingService $pricingService)
    {
        $this->pricingService = $pricingService;
    }

    /**
     * Lister toutes les entreprises (admin only)
     */
    public function index(Request $request)
    {
        $this->requireRole('admin');

        $companies = Company::with([
            'contactUser',
            'subscriptions' => fn($q) => $q->latest()->limit(1),
            'employees' => fn($q) => $q->where('account_status', 'active'),
        ])
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $companies,
        ]);
    }

    /**
     * Obtenir les détails d'une entreprise
     * 
     * SÉCURITÉ STRICTE:
     * - Admin peut voir toutes les entreprises
     * - Propriétaire ne peut voir que la sienne
     * - Aucun accès croisé entre entreprises
     */
    public function show(Company $company)
    {
        // Vérifier l'accès
        if (!$this->canAccessCompany($company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé. Vous ne pouvez accéder qu\'aux données de votre propre entreprise.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $company->load([
                'contactUser',
                'subscriptions' => fn($q) => $q->latest(),
                'employees' => fn($q) => $q->orderBy('created_at'),
                'deliveryLogs' => fn($q) => $q->latest()->limit(10),
            ]),
        ]);
    }

    /**
     * Créer une nouvelle entreprise
     */
    public function store(Request $request)
    {
        $this->requireRole('admin');

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:companies',
            'slug' => 'required|string|max:100|unique:companies',
            'email' => 'required|email|unique:companies',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'institution_type' => Rule::in(['État', 'Hôpital', 'École', 'Université', 'Privée']),
            'contact_user_id' => 'required|exists:users,id',
            'description' => 'nullable|string',
        ]);

        $company = Company::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Entreprise créée',
            'data' => $company,
        ], 201);
    }

    /**
     * Mettre à jour une entreprise.
     * En statut pending, l'admin peut définir pending_employees (liste d'agents) pour permettre l'approbation.
     */
    public function update(Request $request, Company $company)
    {
        $this->requireRole('admin');

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('companies')->ignore($company->id)],
            'email' => ['sometimes', 'email', Rule::unique('companies')->ignore($company->id)],
            'phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string',
            'description' => 'nullable|string',
            'status' => ['sometimes', Rule::in(['pending', 'active', 'suspended', 'rejected'])],
            'pending_employees' => ['sometimes', 'array', 'min:1'],
            'pending_employees.*.full_name' => 'required|string|max:255',
        ]);

        $updateData = array_filter($validated, fn($v) => $v !== null);
        if (isset($validated['pending_employees']) && $company->status === 'pending') {
            $updateData['pending_employees'] = $validated['pending_employees'];
            $updateData['employee_count'] = count($validated['pending_employees']);
        }

        $company->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Entreprise mise à jour',
            'data' => $company,
        ]);
    }

    /**
     * Approuver une entreprise : passe le statut en active et enregistre la liste des agents (référence livraison).
     * Aucun compte agent n'est créé : la liste sert uniquement à identifier les personnes à servir lors de la livraison.
     * Chaque agent reçoit un code unique par entreprise : C{company_id}-E{index} (ex. C1-E1, C1-E2 pour entreprise 1).
     */
    public function approve(Request $request, Company $company)
    {
        $this->requireRole('admin');

        return DB::transaction(function () use ($request, $company) {
            $employeesList = $request->input('employees');

            if (empty($employeesList) && !empty($company->pending_employees)) {
                $employeesList = [];
                foreach ($company->pending_employees as $i => $item) {
                    $employeesList[] = [
                        'full_name' => $item['full_name'] ?? (is_string($item) ? $item : 'Agent ' . ($i + 1)),
                        'function' => $item['function'] ?? $item['fonction'] ?? 'employ',
                        'phone' => $item['phone'] ?? $company->phone ?? '',
                        'matricule' => $item['matricule'] ?? null,
                    ];
                }
            }

            if ($request->has('employees') && is_array($request->employees) && count($request->employees) > 0) {
                $validated = $request->validate([
                    'employees' => 'array|min:1',
                    'employees.*.full_name' => 'required|string',
                    'employees.*.function' => 'nullable|string',
                    'employees.*.phone' => 'nullable|string',
                ]);
                $employeesList = array_map(fn ($e) => [
                    'full_name' => $e['full_name'],
                    'function' => $e['function'] ?? 'employ',
                    'phone' => $e['phone'] ?? $company->phone ?? '',
                ], $validated['employees']);
            }

            if (empty($employeesList) || !is_array($employeesList)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible d\'approuver sans liste d\'agents. L\'entreprise doit avoir fourni la liste des agents lors de l\'inscription. Si cette entreprise a été créée sans liste, ajoutez les agents depuis la fiche entreprise puis réessayez.',
                ], 422);
            }

            $prefix = 'C' . $company->id . '-E';
            $listWithCodes = [];
            foreach ($employeesList as $i => $item) {
                $listWithCodes[] = [
                    'full_name' => $item['full_name'],
                    'function' => $item['function'] ?? $item['fonction'] ?? 'employ',
                    'matricule' => $item['matricule'] ?? $prefix . ($i + 1),
                    'phone' => $item['phone'] ?? $company->phone ?? '',
                ];
            }

            $company->update([
                'status' => 'active',
                'employee_count' => count($listWithCodes),
                'pending_employees' => $listWithCodes,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Entreprise approuvée. Liste des agents enregistrée (référence livraison). Aucun compte agent créé.',
                'agents_count' => count($listWithCodes),
                'agents' => $listWithCodes,
            ]);
        });
    }

    /**
     * Rejeter une entreprise
     */
    public function reject(Request $request, Company $company)
    {
        $this->requireRole('admin');

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $company->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Entreprise rejetée',
        ]);
    }

    /**
     * Supprimer une entreprise
     */
    public function destroy(Company $company)
    {
        $this->requireRole('admin');

        $company->delete();

        return response()->json([
            'success' => true,
            'message' => 'Entreprise supprimée',
        ]);
    }

    /**
     * Vérifier si l'utilisateur peut accéder à cette entreprise
     * 
     * SÉCURITÉ STRICTE:
     * - Admin peut accéder à toutes les entreprises
     * - Propriétaire ne peut accéder qu'à la sienne
     * - Aucune croissance d'accès entre entreprises
     * - Tous les autres accès sont refusés
     */
    private function canAccessCompany(Company $company): bool
    {
        $user = auth()->user();

        // Admin peut voir tous
        if ($this->hasRole('admin')) {
            return true;
        }

        // Propriétaire de l'entreprise UNIQUEMENT
        if ($company->contact_user_id === $user->id) {
            return true;
        }

        // Tous les autres accès sont refusés
        return false;
    }
}
