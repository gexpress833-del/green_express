<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id','subscription_id','provider','provider_payment_id','amount','currency','status','raw_response'
    ];

    protected $casts = [
        'raw_response' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
}
