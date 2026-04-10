<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanySubscription extends Model
{
    protected $fillable = [
        'company_id',
        'pricing_tier_id',
        'price_per_agent',
        'agent_count',
        'total_monthly_price',
        'currency',
        'start_date',
        'end_date',
        'status',
        'payment_status',
        'meals_provided',
        'meals_remaining',
    ];

    protected $casts = [
        'price_per_agent' => 'decimal:2',
        'total_monthly_price' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'meals_provided' => 'integer',
        'meals_remaining' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function pricingTier(): BelongsTo
    {
        return $this->belongsTo(PricingTier::class);
    }

    public function employeeMealPlans(): HasMany
    {
        return $this->hasMany(EmployeeMealPlan::class, 'subscription_id');
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(DeliveryLog::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(SubscriptionHistory::class, 'subscription_id');
    }

    /**
     * Calcul du nombre total de repas pour le mois
     * 5 jours (Lun-Ven) × 4 semaines = 20 repas par agent
     */
    public function getTotalMealsPerAgent(): int
    {
        return 20; // 5 jours × 4 semaines
    }

    public function getTotalMealsForMonth(): int
    {
        return $this->agent_count * $this->getTotalMealsPerAgent();
    }

    public function getProgressPercentage(): float
    {
        $total = $this->getTotalMealsForMonth();
        return $total > 0 ? ($this->meals_provided / $total) * 100 : 0;
    }

    public function getStatusLabel(): string
    {
        return match($this->status) {
            'pending' => 'En attente',
            'active' => 'Active',
            'expired' => 'Expirée',
            'cancelled' => 'Annulée',
            default => $this->status
        };
    }

    public function getPaymentStatusLabel(): string
    {
        return match($this->payment_status) {
            'pending' => 'En attente de paiement',
            'paid' => 'Payée',
            'failed' => 'Échouée',
            'refunded' => 'Remboursée',
            default => $this->payment_status
        };
    }
}
