<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PointLedger extends Model
{
    protected $fillable = [
        'user_id','delta','reason','order_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
