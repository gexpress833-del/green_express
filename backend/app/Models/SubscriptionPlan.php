<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    public const SCOPE_INDIVIDUAL = 'individual';

    public const SCOPE_COMPANY = 'company';

    public const SCOPE_BOTH = 'both';

    protected $fillable = [
        'name',
        'description',
        'plan_scope',
        'meal_types',
        'highlights',
        'price_week',
        'price_month',
        'currency',
        'days_per_week',
        'days_per_month',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price_week' => 'decimal:2',
        'price_month' => 'decimal:2',
        'days_per_week' => 'integer',
        'days_per_month' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'meal_types' => 'array',
        'highlights' => 'array',
    ];

    /** Plans visibles pour les clients particuliers (hors B2B entreprise uniquement). */
    public function scopeForIndividuals($query)
    {
        return $query->where(function ($q) {
            $q->whereIn('plan_scope', [self::SCOPE_INDIVIDUAL, self::SCOPE_BOTH])
                ->orWhereNull('plan_scope');
        });
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /** Plats / visuels marketing inclus dans la formule (ordre d’affichage). */
    public function items(): HasMany
    {
        return $this->hasMany(SubscriptionPlanItem::class)->orderBy('sort_order');
    }
}
