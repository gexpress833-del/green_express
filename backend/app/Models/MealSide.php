<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MealSide extends Model
{
    protected $fillable = [
        'company_menu_id',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function menu(): BelongsTo
    {
        return $this->belongsTo(CompanyMenu::class, 'company_menu_id');
    }

    public function mealPlans(): HasMany
    {
        return $this->hasMany(EmployeeMealPlan::class, 'side_id');
    }
}
