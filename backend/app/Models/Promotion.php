<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasFactory;
    protected $fillable = [
        'admin_id',
        'menu_id',
        'image',       // Image propre à la promotion (repas spécial), indépendante du menu
        'title',       // Titre propre à la promotion
        'description', // Description propre à la promotion
        'points_required',
        'discount',
        'start_at',
        'end_at',
        'quantity_limit',
    ];

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }
}
