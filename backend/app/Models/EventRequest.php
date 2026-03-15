<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRequest extends Model
{
    protected $fillable = [
        'event_type',
        'event_date',
        'guest_count',
        'budget',
        'message',
        'contact_name',
        'contact_email',
        'contact_phone',
        'user_id',
        'status',
        'admin_response',
        'responded_at',
        'responded_by',
    ];

    protected $casts = [
        'event_date' => 'date',
        'responded_at' => 'datetime',
    ];

    public function respondedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
