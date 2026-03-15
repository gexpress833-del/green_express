<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    /** Nombre de jours ouvrés par semaine (hors week-end). */
    public const WORKING_DAYS_PER_WEEK = 5;

    /** Nombre de jours ouvrés pour un abonnement mensuel (5 j/sem × 4 semaines). */
    public const WORKING_DAYS_PER_MONTH = 20;

    public const STATUS_PENDING = 'pending';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAUSED = 'paused';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'uuid', 'user_id', 'subscription_plan_id', 'plan', 'price', 'period', 'currency', 'status', 'started_at', 'expires_at', 'rejected_reason',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isPaused(): bool
    {
        return $this->status === self::STATUS_PAUSED;
    }

    /**
     * Calcule la date d'expiration à partir de la date de début, en jours ouvrés uniquement
     * (lun–ven : 5 j/semaine, 20 j/mois, week-end exclus).
     *
     * @param  Carbon  $startedAt  Date de début de l'abonnement
     * @param  string  $period  'week' = 5 jours ouvrés, 'month' = 20 jours ouvrés
     * @return Carbon Date d'expiration (début du jour suivant le dernier jour ouvré)
     */
    public static function computeExpiresAt(Carbon $startedAt, string $period): Carbon
    {
        $workingDays = $period === 'week'
            ? self::WORKING_DAYS_PER_WEEK
            : self::WORKING_DAYS_PER_MONTH;

        // Compte started_at comme 1er jour ouvré ; on ajoute (workingDays - 1) jours ouvrés pour atteindre le dernier jour de validité
        $date = $startedAt->copy()->startOfDay();
        $toAdd = $workingDays - 1;
        $added = 0;
        while ($added < $toAdd) {
            $date->addDay();
            if (! $date->isWeekend()) {
                $added++;
            }
        }
        // expires_at = début du jour suivant le dernier jour ouvré (abonnement valide tout le dernier jour)
        $date->addDay()->startOfDay();

        return $date;
    }

    /** Jours restants avant expiration (null si pas encore actif ou déjà expiré) */
    public function daysUntilExpiry(): ?int
    {
        if (! $this->expires_at || ! $this->isActive()) {
            return null;
        }
        $days = now()->startOfDay()->diffInDays($this->expires_at->startOfDay(), false);

        return $days >= 0 ? (int) $days : 0;
    }
}

