<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PricingTier extends Model
{
    protected $fillable = [
        'plan_name',
        'min_employees',
        'max_employees',
        'price_per_meal_usd',
        'price_per_meal_cdf',
        'exchange_rate',
        'currency',
        'description',
        'is_active',
    ];

    protected $casts = [
        'price_per_meal_usd' => 'decimal:2',
        'price_per_meal_cdf' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'is_active' => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(CompanySubscription::class);
    }

    public function menus(): HasMany
    {
        return $this->hasMany(CompanyMenu::class);
    }

    public static function getTierForEmployeeCount(int $count): ?self
    {
        return self::where('is_active', true)
            ->where('min_employees', '<=', $count)
            ->where('max_employees', '>=', $count)
            ->first();
    }

    public function getPriceForCurrency(string $currency): float
    {
        return $currency === 'USD' 
            ? (float) $this->price_per_meal_usd 
            : (float) $this->price_per_meal_cdf;
    }
}
