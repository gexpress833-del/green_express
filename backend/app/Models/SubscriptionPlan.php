<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'description',
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
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
