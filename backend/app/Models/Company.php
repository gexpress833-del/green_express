<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Company extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'address',
        'siret',
        'institution_type',
        'employee_count',
        'pending_employees',
        'status',
        'rejection_reason',
        'contact_user_id',
        'monthly_budget',
    ];

    protected $casts = [
        'employee_count' => 'integer',
        'monthly_budget' => 'decimal:2',
        'pending_employees' => 'array',
    ];

    public function contactUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contact_user_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(CompanySubscription::class);
    }

    public function activeSubscription(): BelongsTo
    {
        return $this->belongsTo(CompanySubscription::class)
            ->where('status', 'active');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(CompanyEmployee::class);
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(DeliveryLog::class);
    }

    public function subscriptionHistory(): HasMany
    {
        return $this->hasMany(SubscriptionHistory::class);
    }

    public function getStatusLabel(): string
    {
        return match($this->status) {
            'pending' => 'En attente',
            'active' => 'Active',
            'suspended' => 'Suspendue',
            'ended' => 'Terminée',
            default => $this->status
        };
    }

    public function getInstitutionLabel(): string
    {
        return match($this->institution_type) {
            'etat' => 'Institution d\'État',
            'hopital' => 'Hôpital',
            'ecole' => 'École',
            'universite' => 'Université',
            'privee' => 'Entreprise Privée',
            default => $this->institution_type
        };
    }
}
