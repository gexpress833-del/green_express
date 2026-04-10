<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    use HasFactory;
    protected $fillable = [
        'title', 'name', 'description', 'image', 'price', 'currency', 'status', 'available_from', 'available_to', 'created_by', 'is_available', 'is_popular'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by')->withDefault([
            'name' => 'Utilisateur supprimé',
            'id' => null
        ]);
    }
}
