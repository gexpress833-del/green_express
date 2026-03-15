<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromotionClaim extends Model
{
    protected $fillable = [
        'user_id',
        'promotion_id',
        'points_deducted',
        'status',
        'ticket_code',
        'validated_at',
    ];

    protected $casts = [
        'validated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }
}
