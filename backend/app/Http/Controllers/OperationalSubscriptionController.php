<?php

namespace App\Http\Controllers;

use App\Models\CompanySubscription;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\SubscriptionOperationalService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OperationalSubscriptionController extends Controller
{
    public function __construct(private SubscriptionOperationalService $operational)
    {
    }

    private function authorizeOperational(Request $request): ?JsonResponse
    {
        $user = $request->user();
        if (! $user || ! in_array($user->role, ['admin', 'cuisinier'], true)) {
            return response()->json(['message' => 'Accès réservé à l’administration ou à la cuisine.'], 403);
        }

        return null;
    }

    /**
     * Liste filtrée pour l’exploitation (particuliers + option entreprise).
     *
     * Query: status, date_filter (today|tomorrow|week), type (personal|company|all), deliver_tomorrow (1)
     */
    public function index(Request $request): JsonResponse
    {
        if ($r = $this->authorizeOperational($request)) {
            return $r;
        }

        $type = $request->get('type', 'personal');
        if (! in_array($type, ['personal', 'company', 'all'], true)) {
            $type = 'personal';
        }

        $deliverTomorrow = $request->boolean('deliver_tomorrow');
        $status = $request->get('status');
        $dateFilter = $request->get('date_filter');

        $personal = collect();
        if (in_array($type, ['personal', 'all'], true)) {
            $q = Subscription::query()
                ->with([
                    'user:id,name,email',
                    'subscriptionPlan' => fn ($q) => $q->with(['items' => fn ($iq) => $iq->orderBy('sort_order')->limit(8)]),
                ])
                ->orderByDesc('created_at');

            if ($deliverTomorrow) {
                $q->deliverOnDay(Carbon::tomorrow());
            } else {
                $q->whereStatusFilter($status)->whereDateFilter($dateFilter);
            }

            $personal = $q->get()->map(fn (Subscription $s) => $this->serializePersonal($s, $request->user()->role === 'admin'));
        }

        $company = collect();
        if (in_array($type, ['company', 'all'], true)) {
            $company = $this->queryCompanySubscriptions($status, $dateFilter, $deliverTomorrow)
                ->get()
                ->map(fn (CompanySubscription $c) => $this->serializeCompany($c));
        }

        $merged = $type === 'all'
            ? $personal->concat($company)->sortByDesc(fn ($row) => strtotime((string) ($row['sort_ts'] ?? $row['created_at'] ?? '')))->values()
            : ($type === 'company' ? $company : $personal);

        return response()->json([
            'data' => $merged->values(),
            'meta' => [
                'type' => $type,
                'deliver_tomorrow' => $deliverTomorrow,
                'status' => $status,
                'date_filter' => $dateFilter,
            ],
        ]);
    }

    /**
     * Synthèse repas à préparer (demain par défaut).
     */
    public function tomorrow(Request $request): JsonResponse
    {
        if ($r = $this->authorizeOperational($request)) {
            return $r;
        }

        $summary = $this->operational->buildTomorrowPrepSummary();

        $subs = Subscription::query()
            ->deliverOnDay(Carbon::tomorrow())
            ->with(['user:id,name,email', 'subscriptionPlan'])
            ->orderBy('id')
            ->get()
            ->map(fn (Subscription $s) => [
                'subscription_kind' => 'personal',
                'id' => $s->id,
                'client_name' => $s->user?->name ?? $s->user?->email,
                'plan_name' => $s->plan,
                'meal_hint' => $this->operational->mealSummaryForDay($s->subscriptionPlan, Carbon::tomorrow()),
            ]);

        return response()->json([
            'summary' => $summary,
            'subscriptions' => $subs,
        ]);
    }

    /**
     * Compteurs rapides pour tableaux de bord.
     */
    public function stats(Request $request): JsonResponse
    {
        if ($r = $this->authorizeOperational($request)) {
            return $r;
        }

        $tomorrowSummary = $this->operational->buildTomorrowPrepSummary();

        return response()->json([
            'subscriptions' => [
                'active' => Subscription::where('status', Subscription::STATUS_ACTIVE)->count(),
                'scheduled' => Subscription::where('status', Subscription::STATUS_SCHEDULED)->count(),
                'pending' => Subscription::where('status', Subscription::STATUS_PENDING)->count(),
                'expired' => Subscription::where('status', Subscription::STATUS_EXPIRED)->count(),
            ],
            'tomorrow' => [
                'meal_count' => $tomorrowSummary['estimated_meals'],
                'client_count' => $tomorrowSummary['client_count'],
                'menu_summary' => $tomorrowSummary['menu_summary'],
                'weekday_label' => $tomorrowSummary['weekday_label'],
                'is_weekend' => $tomorrowSummary['is_weekend'],
                'date' => $tomorrowSummary['date'],
            ],
            'scheduled_starting_tomorrow' => Subscription::query()
                ->where('status', Subscription::STATUS_SCHEDULED)
                ->whereDate('started_at', Carbon::tomorrow())
                ->count(),
        ]);
    }

    private function serializePersonal(Subscription $s, bool $includePaymentFlag): array
    {
        $next = $s->nextMealDate();

        $row = [
            'subscription_kind' => 'personal',
            'sort_ts' => $s->created_at?->toIso8601String(),
            'id' => $s->id,
            'uuid' => $s->uuid,
            'status' => $s->status,
            'plan' => $s->plan,
            'period' => $s->period,
            'price' => $s->price,
            'currency' => $s->currency,
            'started_at' => $s->started_at,
            'expires_at' => $s->expires_at,
            'created_at' => $s->created_at,
            'user' => $s->user,
            'subscription_plan' => $s->subscriptionPlan,
            'next_meal_day' => $next?->toDateString(),
            'next_meal_label' => $next
                ? $this->operational->mealSummaryForDay($s->subscriptionPlan, $next)
                : null,
            'subscription_type_label' => 'Particulier',
        ];

        if ($includePaymentFlag) {
            $row['has_payment_received'] = Payment::where('subscription_id', $s->id)
                ->whereIn('status', ['completed', 'paid'])->exists();
        }

        return $row;
    }

    private function serializeCompany(CompanySubscription $c): array
    {
        $c->loadMissing('company:id,name');

        return [
            'subscription_kind' => 'company',
            'sort_ts' => $c->created_at?->toIso8601String(),
            'id' => $c->id,
            'status' => $c->status,
            'plan' => 'Entreprise',
            'company_name' => $c->company?->name,
            'price' => $c->total_monthly_price,
            'currency' => $c->currency,
            'started_at' => $c->start_date,
            'expires_at' => $c->end_date,
            'created_at' => $c->created_at,
            'user' => null,
            'subscription_agent_count' => $c->agent_count,
            'subscription_type_label' => 'Entreprise',
            'next_meal_day' => null,
            'next_meal_label' => null,
        ];
    }

    private function queryCompanySubscriptions(?string $status, ?string $dateFilter, bool $deliverTomorrow)
    {
        $q = CompanySubscription::query()->with('company:id,name')->orderByDesc('created_at');

        if ($status === null || $status === '') {
            // skip
        } elseif ($status === 'scheduled') {
            $q->where('status', 'pending');
        } else {
            $q->where('status', $status);
        }

        if ($deliverTomorrow) {
            $q->where('status', 'active')
                ->whereDate('start_date', '<=', Carbon::tomorrow())
                ->whereDate('end_date', '>=', Carbon::tomorrow());

            return $q;
        }

        if ($dateFilter === 'today') {
            $q->whereDate('start_date', '<=', now()->toDateString())
                ->whereDate('end_date', '>=', now()->toDateString());
        } elseif ($dateFilter === 'tomorrow') {
            $q->whereDate('start_date', '<=', Carbon::tomorrow()->toDateString())
                ->whereDate('end_date', '>=', Carbon::tomorrow()->toDateString());
        } elseif ($dateFilter === 'week') {
            $start = now()->startOfWeek(Carbon::MONDAY)->toDateString();
            $end = now()->endOfWeek(Carbon::SUNDAY)->toDateString();
            $q->whereDate('start_date', '<=', $end)->whereDate('end_date', '>=', $start);
        }

        return $q;
    }
}
