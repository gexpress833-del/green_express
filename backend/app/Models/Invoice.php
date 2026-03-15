<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'subscription_id',
        'amount',
        'currency',
        'pdf_url',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * Crée une facture pour la commande si elle n'existe pas (appelé à la validation livraison).
     */
    public static function createForOrderIfMissing(Order $order): void
    {
        if (static::where('order_id', $order->id)->exists()) {
            return;
        }
        $payment = Payment::where('order_id', $order->id)->whereIn('status', ['completed', 'paid'])->first();
        $amount = $payment ? (float) $payment->amount : (float) $order->total_amount;
        $currency = $payment ? ($payment->currency ?? 'CDF') : 'CDF';
        static::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'subscription_id' => null,
            'amount' => $amount,
            'currency' => $currency,
        ]);
    }

    /**
     * Crée une facture pour l'abonnement si elle n'existe pas (appelé à la validation admin).
     */
    public static function createForSubscriptionIfMissing(Subscription $subscription): void
    {
        if (static::where('subscription_id', $subscription->id)->exists()) {
            return;
        }
        static::create([
            'user_id' => $subscription->user_id,
            'order_id' => null,
            'subscription_id' => $subscription->id,
            'amount' => (float) $subscription->price,
            'currency' => $subscription->currency ?? 'CDF',
        ]);
    }
}
