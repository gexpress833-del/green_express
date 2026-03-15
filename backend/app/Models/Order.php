<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'uuid', 'user_id', 'livreur_id', 'company_id', 'status', 'total_amount', 'delivery_address', 'delivery_code', 'points_earned'
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function deliveryDriver()
    {
        return $this->belongsTo(User::class, 'livreur_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
