<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Carbon\Carbon;

class SubscriptionOperationalService
{
    /**
     * Libellé de menu pour un jour ouvré (lun–ven) à partir du plan.
     * Si meal_types contient 5 entrées, on mappe l’index 0–4 au jour ouvré.
     */
    public function mealSummaryForDay(?SubscriptionPlan $plan, Carbon $day): string
    {
        if ($day->isWeekend()) {
            return '—';
        }

        // Sans plan lié, le volume compte quand même 1 repas (voir mealVolumeForSubscription) :
        // afficher un libellé lisible au lieu de « — ».
        if (! $plan) {
            return 'Menu du jour';
        }

        $types = $plan->meal_types;
        if (! is_array($types) || $types === []) {
            return 'Menu du jour';
        }

        $weekdayIndex = match ((int) $day->dayOfWeek) {
            Carbon::MONDAY => 0,
            Carbon::TUESDAY => 1,
            Carbon::WEDNESDAY => 2,
            Carbon::THURSDAY => 3,
            Carbon::FRIDAY => 4,
            default => 0,
        };

        if (count($types) >= 5) {
            $entry = $types[$weekdayIndex] ?? $types[0];

            return $this->labelFromMealEntry($entry);
        }

        $labels = array_map(fn ($e) => $this->labelFromMealEntry($e), $types);

        return implode(' + ', array_filter($labels)) ?: 'Menu du jour';
    }

    private function labelFromMealEntry(mixed $entry): string
    {
        if (! is_array($entry)) {
            return (string) $entry;
        }

        $label = trim((string) ($entry['label'] ?? ''));
        $emoji = trim((string) ($entry['emoji'] ?? ''));

        return trim($emoji.' '.$label) ?: 'Repas';
    }

    /**
     * Volume estimé de repas pour un jour (nombre de clients × prestations par jour selon le plan).
     */
    public function mealVolumeForSubscription(Subscription $sub, Carbon $day): int
    {
        if (! $sub->coversDay($day)) {
            return 0;
        }

        $plan = $sub->subscriptionPlan;
        $types = $plan?->meal_types;
        $perDay = (is_array($types) && count($types) > 0) ? count($types) : 1;

        return max(1, $perDay);
    }

    /**
     * Résumé agrégé pour la préparation (demain ou autre jour ouvré).
     *
     * @return array{date:string,weekday_label:string,is_weekend:bool,client_count:int,estimated_meals:int,menu_summary:string,by_label:array<string,int>}
     */
    public function buildTomorrowPrepSummary(?Carbon $target = null): array
    {
        $day = ($target ?? Carbon::tomorrow())->copy()->startOfDay();

        if ($day->isWeekend()) {
            return [
                'date' => $day->toDateString(),
                'weekday_label' => $this->frenchWeekday($day),
                'is_weekend' => true,
                'client_count' => 0,
                'estimated_meals' => 0,
                'menu_summary' => 'Week-end — pas de livraison ouvrée',
                'by_label' => [],
            ];
        }

        $subs = Subscription::query()
            ->deliverOnDay($day)
            ->with(['user:id,name,email', 'subscriptionPlan'])
            ->orderBy('id')
            ->get();

        $byLabel = [];
        $meals = 0;

        foreach ($subs as $sub) {
            $plan = $sub->subscriptionPlan;
            $summary = $this->mealSummaryForDay($plan, $day);
            $vol = $this->mealVolumeForSubscription($sub, $day);
            $meals += $vol;
            $byLabel[$summary] = ($byLabel[$summary] ?? 0) + $vol;
        }

        arsort($byLabel);
        $topSummary = array_key_first($byLabel) ?? 'Menu du jour';

        return [
            'date' => $day->toDateString(),
            'weekday_label' => $this->frenchWeekday($day),
            'is_weekend' => false,
            'client_count' => $subs->count(),
            'estimated_meals' => $meals,
            'menu_summary' => $topSummary,
            'by_label' => $byLabel,
        ];
    }

    private function frenchWeekday(Carbon $d): string
    {
        return match ((int) $d->dayOfWeek) {
            Carbon::MONDAY => 'Lundi',
            Carbon::TUESDAY => 'Mardi',
            Carbon::WEDNESDAY => 'Mercredi',
            Carbon::THURSDAY => 'Jeudi',
            Carbon::FRIDAY => 'Vendredi',
            Carbon::SATURDAY => 'Samedi',
            default => 'Dimanche',
        };
    }
}
