<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryLog extends Model
{
    protected $fillable = [
        'meal_plan_id',
        'company_id',
        'delivery_date',
        'day_of_week',
        'quantity_delivered',
        'status',
        'notes',
        'delivered_at',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'quantity_delivered' => 'integer',
        'delivered_at' => 'datetime',
    ];

    public function mealPlan(): BelongsTo
    {
        return $this->belongsTo(EmployeeMealPlan::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * SÉCURITÉ: Scope pour filtrer par entreprise
     * Chaque livraison est associée à une entreprise
     * Une entreprise ne voit que ses propres livraisons
     */
    public function scopeByCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function getStatusLabel(): string
    {
        return match($this->status) {
            'pending' => 'En attente',
            'delivered' => 'Livré',
            'failed' => 'Échec',
            'cancelled' => 'Annulé',
            default => $this->status
        };
    }

    public function getDayLabel(): string
    {
        return match($this->day_of_week) {
            'monday' => 'Lundi',
            'tuesday' => 'Mardi',
            'wednesday' => 'Mercredi',
            'thursday' => 'Jeudi',
            'friday' => 'Vendredi',
            default => $this->day_of_week
        };
    }
}
