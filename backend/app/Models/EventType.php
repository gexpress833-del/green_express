<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class EventType extends Model
{
    protected $fillable = [
        'title',
        'description',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Scope global pour les requêtes normales (API, etc)
    protected static function booted()
    {
        static::addGlobalScope('active', function (Builder $query) {
            // Pas de filtre pour Filament (les admins doivent voir tous les types)
            // Vérifie si on n'est pas dans l'admin Filament
            if (!request()->is('admin*')) {
                $query->where('is_active', true);
            }
        });
    }
}

