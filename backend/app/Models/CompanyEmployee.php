<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Hash;

class CompanyEmployee extends Model
{
    protected $fillable = [
        'company_id',
        'full_name',
        'function',
        'matricule',
        'phone',
        'email',
        'password',
        'account_status',
        'current_subscription_id',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'password' => 'hashed',
    ];

    /**
     * SÉCURITÉ: Scope pour filtrer par entreprise
     * Chaque employé est strictement lié à son entreprise
     * Aucun partage d'employés entre entreprises
     */
    public function scopeByCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeActive($query)
    {
        return $query->where('account_status', 'active');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function currentSubscription(): BelongsTo
    {
        return $this->belongsTo(CompanySubscription::class, 'current_subscription_id');
    }

    public function mealPlans(): HasMany
    {
        return $this->hasMany(EmployeeMealPlan::class);
    }

    public function activeMealPlan()
    {
        $today = now();
        return $this->mealPlans()
            ->where('valid_from', '<=', $today)
            ->where('valid_until', '>=', $today)
            ->where('status', '!=', 'completed')
            ->first();
    }

    public function currentMealPlan()
    {
        return $this->activeMealPlan();
    }

    public static function generateEmail(Company $company, string $matricule): string
    {
        $companySlug = str($company->name)->slug();
        return "{$matricule}@{$companySlug}.greenexpress.com";
    }

    public static function generatePassword(): string
    {
        return bin2hex(random_bytes(8)); // 16 caractères aléatoires
    }

    public function getFunctionLabel(): string
    {
        return match($this->function) {
            'directeur' => 'Directeur',
            'manager' => 'Manager',
            'employ' => 'Employé',
            'stagiaire' => 'Stagiaire',
            'autre' => 'Autre',
            default => $this->function
        };
    }

    public function getAccountStatusLabel(): string
    {
        return match($this->account_status) {
            'pending' => 'En attente d\'activation',
            'active' => 'Actif',
            'inactive' => 'Inactif',
            default => $this->account_status
        };
    }
}
