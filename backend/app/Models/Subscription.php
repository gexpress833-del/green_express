<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
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
    /** Payé / validé, en attente du premier jour ouvré (avant started_at). */
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAUSED = 'paused';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'uuid', 'user_id', 'subscription_plan_id', 'plan', 'price', 'period', 'currency', 'status', 'started_at', 'expires_at', 'requested_at', 'rejected_reason',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'requested_at' => 'datetime',
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

    public function isScheduled(): bool
    {
        return $this->status === self::STATUS_SCHEDULED;
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
    /**
     * Première date d’effet des repas après confirmation du paiement.
     * Lun–jeu : lendemain à 00:00. Ven, sam, dim : lundi suivant à 00:00.
     */
    public static function computeActivationStart(Carbon $paymentConfirmedAt): Carbon
    {
        $from = $paymentConfirmedAt->copy();
        $dow = (int) $from->dayOfWeek;

        if ($dow === Carbon::FRIDAY || $dow === Carbon::SATURDAY || $dow === Carbon::SUNDAY) {
            return $from->copy()->next(Carbon::MONDAY)->startOfDay();
        }

        return $from->copy()->addDay()->startOfDay();
    }

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

    /** Jours avant le premier jour d’effet (statut scheduled uniquement). */
    public function daysUntilStart(): ?int
    {
        if (! $this->isScheduled() || ! $this->started_at) {
            return null;
        }
        $start = $this->started_at->copy()->startOfDay();
        $today = now()->startOfDay();
        if ($start->lessThanOrEqualTo($today)) {
            return 0;
        }

        return (int) $today->diffInDays($start);
    }

    /**
     * Passe de pending à scheduled : premier jour ouvré + fin calculée en jours ouvrés.
     * Idempotent si déjà autre statut.
     */
    public static function applyPaymentConfirmedScheduling(self $subscription, Carbon $paymentAt): void
    {
        if (! $subscription->isPending()) {
            return;
        }

        $start = self::computeActivationStart($paymentAt);
        $expires = self::computeExpiresAt($start, $subscription->period);

        $subscription->update([
            'status' => self::STATUS_SCHEDULED,
            'requested_at' => $paymentAt,
            'started_at' => $start,
            'expires_at' => $expires,
        ]);

        Invoice::createForSubscriptionIfMissing($subscription->fresh());
    }

    /**
     * L’abonnement couvre-t-il un repas ce jour-là (jour ouvré, dans la fenêtre d’effet) ?
     */
    public function coversDay(Carbon $day): bool
    {
        $d = $day->copy()->startOfDay();
        if ($d->isWeekend()) {
            return false;
        }

        if (! in_array($this->status, [self::STATUS_ACTIVE, self::STATUS_SCHEDULED], true)) {
            return false;
        }

        if (! $this->started_at || ! $this->expires_at) {
            return false;
        }

        if ($d->lt($this->started_at->copy()->startOfDay())) {
            return false;
        }

        if ($d->gte($this->expires_at->copy()->startOfDay())) {
            return false;
        }

        return true;
    }

    /** Prochain jour de repas à partir d’aujourd’hui (null si aucun). */
    public function nextMealDate(): ?Carbon
    {
        if ($this->status === self::STATUS_SCHEDULED && $this->started_at) {
            return $this->started_at->copy()->startOfDay();
        }

        if (! $this->isActive() || ! $this->started_at || ! $this->expires_at) {
            return null;
        }

        $cursor = now()->startOfDay();
        $end = $this->expires_at->copy()->startOfDay();
        if ($cursor->gte($end)) {
            return null;
        }

        $start = $this->started_at->copy()->startOfDay();
        for ($i = 0; $i < 400; $i++) {
            if ($cursor->gte($end)) {
                break;
            }
            if (! $cursor->isWeekend() && $cursor->gte($start)) {
                return $cursor->copy();
            }
            $cursor->addDay();
        }

        return null;
    }

    /** Abonnements actifs avec repas à livrer ce jour (lun–ven). */
    public function scopeDeliverOnDay(Builder $query, Carbon $day): Builder
    {
        $d = $day->copy()->startOfDay();
        if ($d->isWeekend()) {
            return $query->whereRaw('1 = 0');
        }

        return $query
            ->where('status', self::STATUS_ACTIVE)
            ->whereDate('started_at', '<=', $d)
            ->where('expires_at', '>', $d);
    }

    public function scopeWhereStatusFilter(Builder $query, ?string $status): Builder
    {
        if ($status === null || $status === '') {
            return $query;
        }

        return $query->where('status', $status);
    }

    /**
     * Filtre par période calendaire : abonnements qui intersectent la fenêtre.
     *
     * @param  'today'|'tomorrow'|'week'|null  $filter
     */
    public function scopeWhereDateFilter(Builder $query, ?string $filter): Builder
    {
        if ($filter === null || $filter === '') {
            return $query;
        }

        if ($filter === 'today') {
            $start = now()->startOfDay();
            $end = now()->endOfDay();

            return $query->whereDate('started_at', '<=', $end)->where('expires_at', '>', $start);
        }

        if ($filter === 'tomorrow') {
            $tomorrow = now()->copy()->addDay()->startOfDay();
            $end = now()->copy()->addDay()->endOfDay();

            return $query->whereDate('started_at', '<=', $end)->where('expires_at', '>', $tomorrow);
        }

        if ($filter === 'week') {
            $start = now()->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
            $end = now()->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

            return $query->whereDate('started_at', '<=', $end)->where('expires_at', '>', $start);
        }

        return $query;
    }
}

