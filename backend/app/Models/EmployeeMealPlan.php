<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeeMealPlan extends Model
{
    protected $fillable = [
        'company_employee_id',
        'subscription_id',
        'meal_id',
        'side_id',
        'valid_from',
        'valid_until',
        'status',
        'meals_delivered',
        'meals_remaining',
        'confirmed_at',
    ];

    protected $casts = [
        'valid_from' => 'date',
        'valid_until' => 'date',
        'meals_delivered' => 'integer',
        'meals_remaining' => 'integer',
        'confirmed_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(CompanyEmployee::class, 'company_employee_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(CompanySubscription::class, 'subscription_id');
    }

    public function meal(): BelongsTo
    {
        return $this->belongsTo(CompanyMenu::class, 'meal_id');
    }

    public function side(): BelongsTo
    {
        return $this->belongsTo(MealSide::class, 'side_id');
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(DeliveryLog::class);
    }

    /**
     * SÉCURITÉ: Scope pour isoler les plans par employé et company
     * Chaque plan repas est lié à un employé spécifique
     * L'employé ne peut accéder qu'à ses propres plans
     */
    public function scopeByCompany($query, $companyId)
    {
        return $query->whereHas('employee', function ($q) use ($companyId) {
            $q->where('company_id', $companyId);
        });
    }

    public function scopeByEmployee($query, $employeeId)
    {
        return $query->where('company_employee_id', $employeeId);
    }

    public const TOTAL_MEALS = 20; // 5 jours × 4 semaines

    public function getProgressPercentage(): float
    {
        return self::TOTAL_MEALS > 0 ? ($this->meals_delivered / self::TOTAL_MEALS) * 100 : 0;
    }

    public function getStatusLabel(): string
    {
        return match($this->status) {
            'draft' => 'Brouillon',
            'confirmed' => 'Confirmé',
            'partial_delivered' => 'Partiellement livré',
            'completed' => 'Complété',
            default => $this->status
        };
    }

    public function isConfirmed(): bool
    {
        return $this->status !== 'draft';
    }

    public function isCompleted(): bool
    {
        return $this->meals_delivered >= self::TOTAL_MEALS;
    }
}
