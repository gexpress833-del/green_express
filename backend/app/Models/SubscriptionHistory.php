<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionHistory extends Model
{
    protected $table = 'subscription_history';

    protected $fillable = [
        'subscription_id',
        'company_id',
        'action',
        'agent_count_before',
        'agent_count_after',
        'price_before',
        'price_after',
        'details',
        'performed_by',
    ];

    protected $casts = [
        'price_before' => 'decimal:2',
        'price_after' => 'decimal:2',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(CompanySubscription::class, 'subscription_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function performedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function getActionLabel(): string
    {
        return match($this->action) {
            'created' => 'Créé',
            'activated' => 'Activé',
            'renewed' => 'Renouvelé',
            'upgraded' => 'Mis à niveau',
            'downgraded' => 'Rétrogradé',
            'expired' => 'Expiré',
            'cancelled' => 'Annulé',
            default => $this->action
        };
    }
}
