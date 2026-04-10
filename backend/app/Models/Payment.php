<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id', 'subscription_id', 'company_subscription_id', 'provider', 'provider_payment_id', 'reference_id',
        'amount', 'currency', 'phone', 'status', 'failure_reason', 'last_checked_at', 'retry_count', 'raw_response',
    ];

    protected $casts = [
        'raw_response' => 'array',
        'last_checked_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function companySubscription()
    {
        return $this->belongsTo(CompanySubscription::class);
    }
}
