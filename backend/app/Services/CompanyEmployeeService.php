<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanyEmployee;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service pour gérer les employés d'une entreprise
 * Gère la création automatique des comptes, emails, mots de passe
 */
class CompanyEmployeeService
{
    /**
     * Crée les comptes agents à partir de la liste fournie
     * 
     * @param Company $company
     * @param array $employeesList Format: [
     *     ['full_name' => '...', 'function' => '...', 'matricule' => '...', 'phone' => '...'],
     *     ...
     * ]
     * @return array Agents créés avec password temporaire
     */
    public function createEmployeesFromList(Company $company, array $employeesList): array
    {
        return DB::transaction(function () use ($company, $employeesList) {
            $createdEmployees = [];

            foreach ($employeesList as $data) {
                // Valider le matricule est unique par entreprise
                $existing = CompanyEmployee::where('company_id', $company->id)
                    ->where('matricule', $data['matricule'])
                    ->exists();

                if ($existing) {
                    Log::warning('Duplicate matricule', [
                        'company_id' => $company->id,
                        'matricule' => $data['matricule'],
                    ]);
                    continue;
                }

                // Générer email et password
                $email = CompanyEmployee::generateEmail($company, $data['matricule']);
                $temporaryPassword = CompanyEmployee::generatePassword();

                // Créer l'employé
                $employee = CompanyEmployee::create([
                    'company_id' => $company->id,
                    'full_name' => $data['full_name'],
                    'function' => $data['function'] ?? 'employ',
                    'matricule' => $data['matricule'],
                    'phone' => $data['phone'],
                    'email' => $email,
                    'password' => bcrypt($temporaryPassword),
                    'account_status' => 'pending',
                ]);

                $createdEmployees[] = [
                    'employee' => $employee,
                    'temporary_password' => $temporaryPassword,
                ];

                Log::info('Employee account created', [
                    'company_id' => $company->id,
                    'employee_id' => $employee->id,
                    'email' => $email,
                ]);
            }

            return $createdEmployees;
        });
    }

    /**
     * Active un compte employé après vérification
     */
    public function activateEmployee(CompanyEmployee $employee): void
    {
        $employee->update(['account_status' => 'active']);

        Log::info('Employee account activated', [
            'employee_id' => $employee->id,
            'email' => $employee->email,
        ]);
    }

    /**
     * Désactive un compte employé
     */
    public function deactivateEmployee(CompanyEmployee $employee): void
    {
        $employee->update(['account_status' => 'inactive']);

        Log::info('Employee account deactivated', [
            'employee_id' => $employee->id,
            'email' => $employee->email,
        ]);
    }

    /**
     * Génère un nouveau mot de passe temporaire
     */
    public function resetPassword(CompanyEmployee $employee): string
    {
        $temporaryPassword = CompanyEmployee::generatePassword();
        $employee->update(['password' => bcrypt($temporaryPassword)]);

        Log::info('Employee password reset', [
            'employee_id' => $employee->id,
        ]);

        return $temporaryPassword;
    }

    /**
     * Assigne la souscription courante à l'employé
     */
    public function assignSubscription(CompanyEmployee $employee, \App\Models\CompanySubscription $subscription): void
    {
        $employee->update(['current_subscription_id' => $subscription->id]);

        Log::info('Subscription assigned to employee', [
            'employee_id' => $employee->id,
            'subscription_id' => $subscription->id,
        ]);
    }

    /**
     * Retourne les statistiques d'un employé
     */
    public function getEmployeeStats(CompanyEmployee $employee): array
    {
        $activeMealPlan = $employee->mealPlans()
            ->where('status', '!=', 'completed')
            ->latest()
            ->first();

        return [
            'full_name' => $employee->full_name,
            'email' => $employee->email,
            'matricule' => $employee->matricule,
            'function' => $employee->getFunctionLabel(),
            'account_status' => $employee->getAccountStatusLabel(),
            'current_subscription' => $employee->currentSubscription,
            'active_meal_plan' => $activeMealPlan ? [
                'meal' => $activeMealPlan->meal->name,
                'side' => $activeMealPlan->side->name,
                'meals_delivered' => $activeMealPlan->meals_delivered,
                'meals_remaining' => $activeMealPlan->meals_remaining,
                'progress_percentage' => $activeMealPlan->getProgressPercentage(),
            ] : null,
        ];
    }
}
