<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanyMenu extends Model
{
    protected $fillable = [
        'pricing_tier_id',
        'name',
        'description',
        'meal_type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function pricingTier(): BelongsTo
    {
        return $this->belongsTo(PricingTier::class);
    }

    public function sides(): HasMany
    {
        return $this->hasMany(MealSide::class);
    }

    public function mealPlans(): HasMany
    {
        return $this->hasMany(EmployeeMealPlan::class, 'meal_id');
    }
}
