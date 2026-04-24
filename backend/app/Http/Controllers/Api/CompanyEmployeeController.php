<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\AdminRequiresPermission;
use App\Http\Traits\RequireAuth;
use App\Http\Traits\RoleAccess;
use App\Models\Company;
use App\Models\CompanyEmployee;
use App\Services\CompanyEmployeeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Contrôleur pour la gestion des employés d'une entreprise
 */
class CompanyEmployeeController extends Controller
{
    use AdminRequiresPermission;
    use RoleAccess;

    private CompanyEmployeeService $employeeService;

    public function __construct(CompanyEmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    /**
     * Lister les employés d'une entreprise
     * 
     * SÉCURITÉ: Filteré strictement par company_id
     * Une entreprise ne peut voir que ses propres employés
     * Aucun partage d'employés entre entreprises
     */
    public function index(Company $company, Request $request)
    {
        if (!$this->canAccessCompany($company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // SÉCURITÉ: Filtrer STRICTEMENT par company_id
        $employees = $company->employees()
            ->when($request->search, fn($q) => 
                $q->where('full_name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('matricule', 'like', "%{$request->search}%")
            )
            ->when($request->status, fn($q) => $q->where('account_status', $request->status))
            ->with(['currentSubscription', 'mealPlans' => fn($q) => $q->latest()])
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    /**
     * Obtenir les détails d'un employé
     * 
     * SÉCURITÉ: Vérifier que l'employé appartient à la bonne entreprise
     */
    public function show(CompanyEmployee $employee)
    {
        // SÉCURITÉ: Vérifier que l'utilisateur a accès à cette entreprise
        if (!$this->canAccessCompany($employee->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $data = $this->employeeService->getEmployeeStats($employee);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Importer un fichier CSV d'employés
     * 
     * Format CSV attendu (avec headers):
     * full_name;function;matricule;phone
     */
    public function importFromCSV(Request $request, Company $company)
    {
        if ($r = $this->requireAnyPermission($request, ['admin.companies', 'company.employees.manage'])) {
            return $r;
        }

        if (!$this->canAccessCompany($company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120', // 5MB
        ]);

        try {
            $employees = $this->parseCSV($request->file('file'));

            $createdEmployees = $this->employeeService->createEmployeesFromList($company, $employees);

            return response()->json([
                'success' => true,
                'message' => count($createdEmployees) . ' employés créés',
                'employees' => collect($createdEmployees)->map(function ($e) {
                    return [
                        'id' => $e['employee']->id,
                        'full_name' => $e['employee']->full_name,
                        'email' => $e['employee']->email,
                        'temporary_password' => $e['temporary_password'],
                    ];
                })->values(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement du fichier: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Créer un employé manuellement
     */
    public function store(Request $request, Company $company)
    {
        if ($r = $this->requireAnyPermission($request, ['admin.companies', 'company.employees.manage'])) {
            return $r;
        }

        if (!$this->canAccessCompany($company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'function' => 'required|string|max:100',
            'matricule' => [
                'required',
                'string',
                'max:50',
                Rule::unique('company_employees')
                    ->where('company_id', $company->id),
            ],
            'phone' => 'required|string|max:20',
        ]);

        try {
            $createdEmployees = $this->employeeService->createEmployeesFromList(
                $company,
                [$validated]
            );

            if (empty($createdEmployees)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de créer l\'employé',
                ], 400);
            }

            $created = $createdEmployees[0];

            return response()->json([
                'success' => true,
                'message' => 'Employé créé',
                'employee' => [
                    'id' => $created['employee']->id,
                    'full_name' => $created['employee']->full_name,
                    'email' => $created['employee']->email,
                    'temporary_password' => $created['temporary_password'],
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Mettre à jour un employé
     */
    public function update(Request $request, CompanyEmployee $employee)
    {
        if ($r = $this->requireAnyPermission($request, ['admin.companies', 'company.employees.manage'])) {
            return $r;
        }

        if (!$this->canAccessCompany($employee->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'function' => 'sometimes|string|max:100',
            'phone' => 'sometimes|string|max:20',
            'account_status' => Rule::in(['pending', 'active', 'inactive']),
        ]);

        $employee->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Employé mis à jour',
            'data' => $employee,
        ]);
    }

    /**
     * Activer le compte d'un employé
     */
    public function activate(Request $request, CompanyEmployee $employee)
    {
        if ($r = $this->requireAnyPermission($request, ['admin.companies', 'company.employees.manage'])) {
            return $r;
        }

        if (!$this->canAccessCompany($employee->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $this->employeeService->activateEmployee($employee);

        return response()->json([
            'success' => true,
            'message' => 'Compte activé',
            'data' => $employee,
        ]);
    }

    /**
     * Désactiver le compte d'un employé
     */
    public function deactivate(Request $request, CompanyEmployee $employee)
    {
        if ($r = $this->requireAnyPermission($request, ['admin.companies', 'company.employees.manage'])) {
            return $r;
        }

        if (!$this->canAccessCompany($employee->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $this->employeeService->deactivateEmployee($employee);

        return response()->json([
            'success' => true,
            'message' => 'Compte désactivé',
            'data' => $employee,
        ]);
    }

    /**
     * Réinitialiser le mot de passe d'un employé
     */
    public function resetPassword(Request $request, CompanyEmployee $employee)
    {
        if ($r = $this->requireAnyPermission($request, ['admin.companies', 'company.employees.manage'])) {
            return $r;
        }

        if (!$this->canAccessCompany($employee->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $temporaryPassword = $this->employeeService->resetPassword($employee);

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé',
            'temporary_password' => $temporaryPassword,
        ]);
    }

    /**
     * Supprimer un employé
     */
    public function destroy(Request $request, CompanyEmployee $employee)
    {
        if ($r = $this->adminRequires($request, 'admin.companies')) {
            return $r;
        }

        if (!$this->canAccessCompany($employee->company)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employé supprimé',
        ]);
    }

    /**
     * Parser un fichier CSV
     */
    private function parseCSV($file): array
    {
        $employees = [];
        $handle = fopen($file->getRealPath(), 'r');

        // Ignorer la première ligne (headers)
        fgetcsv($handle, 1000, ';');

        while (($data = fgetcsv($handle, 1000, ';')) !== false) {
            if (count($data) >= 4) {
                $employees[] = [
                    'full_name' => trim($data[0]),
                    'function' => trim($data[1]),
                    'matricule' => trim($data[2]),
                    'phone' => trim($data[3]),
                ];
            }
        }

        fclose($handle);

        return $employees;
    }

    /**
     * Vérifier si l'utilisateur peut accéder à cette entreprise
     * 
     * SÉCURITÉ STRICTE:
     * - Admin peut voir toutes les entreprises
     * - Propriétaire entreprise peut voir uniquement la sienne
     * - Les autres rôles ne peuvent pas accéder
     */
    private function canAccessCompany(Company $company): bool
    {
        $user = auth()->user();

        if ($user->canAsAdmin('admin.companies')) {
            return true;
        }

        if ($company->contact_user_id === $user->id && $user->hasPermissionTo('entreprise.b2b.access')) {
            return true;
        }

        // Tous les autres accès sont refusés
        return false;
    }
}
