<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPlanItem extends Model
{
    protected $fillable = [
        'subscription_plan_id',
        'menu_id',
        'title',
        'description',
        'image',
        'meal_slot',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }
}
