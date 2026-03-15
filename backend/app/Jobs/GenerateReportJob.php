<?php

namespace App\Jobs;

use App\Models\Report;
use App\Models\Order;
use App\Models\User;
use App\Models\Subscription;
use App\Models\Payment;
use App\Models\EventRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Report $report
    ) {}

    public function handle(): void
    {
        $report = $this->report;
        $report->update(['status' => 'processing']);

        try {
            $params = $report->params ?? [];
            $type = $params['type'] ?? 'orders';
            $dateFrom = $params['date_from'] ?? null;
            $dateTo = $params['date_to'] ?? null;

            [$title, $headers, $rows] = $this->buildReportData($type, $dateFrom, $dateTo);

            $html = view('reports.pdf', [
                'title' => $title,
                'headers' => $headers,
                'rows' => $rows,
                'generatedAt' => now()->format('d/m/Y H:i'),
            ])->render();

            $pdf = Pdf::loadHTML($html);
            $filename = 'reports/report-' . $report->id . '.pdf';
            Storage::disk('local')->put($filename, $pdf->output());

            $report->update([
                'file_path' => $filename,
                'status' => 'completed',
            ]);
        } catch (\Throwable $e) {
            Log::error('Report generation failed: ' . $e->getMessage(), [
                'report_id' => $report->id,
                'trace' => $e->getTraceAsString(),
            ]);
            $report->update(['status' => 'failed']);
        }
    }

    private function buildReportData(string $type, ?string $dateFrom, ?string $dateTo): array
    {
        $q = fn ($query) => $this->applyDateFilter($query, $dateFrom, $dateTo);

        return match ($type) {
            'orders' => $this->reportOrders($q),
            'users' => $this->reportUsers($q),
            'subscriptions' => $this->reportSubscriptions($q),
            'payments' => $this->reportPayments($q),
            'event_requests' => $this->reportEventRequests($q),
            'activity_summary' => $this->reportActivitySummary($dateFrom, $dateTo),
            default => ['Rapport', [], []],
        };
    }

    private function applyDateFilter($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->where('created_at', '>=', $from);
        }
        if ($to) {
            $query->where('created_at', '<=', $to . ' 23:59:59');
        }
        return $query;
    }

    private function reportOrders(callable $applyFilter): array
    {
        $query = Order::with('user:id,name,email')->orderBy('created_at', 'desc');
        $applyFilter($query);
        $items = $query->get();
        $headers = ['Date', 'N°', 'Client', 'Montant', 'Statut'];
        $rows = $items->map(fn ($o) => [
            $o->created_at?->format('d/m/Y H:i'),
            $o->uuid ?? $o->id,
            $o->user?->name ?? $o->user_id,
            number_format((float) $o->total_amount, 2, ',', ' ') . ' FCFA',
            $o->status ?? '—',
        ])->toArray();
        return ['Rapport Commandes', $headers, $rows];
    }

    private function reportUsers(callable $applyFilter): array
    {
        $query = User::orderBy('created_at', 'desc');
        $applyFilter($query);
        $items = $query->get(['id', 'name', 'email', 'role', 'created_at']);
        $headers = ['Date', 'ID', 'Nom', 'Email', 'Rôle'];
        $rows = $items->map(fn ($u) => [
            $u->created_at?->format('d/m/Y H:i'),
            $u->id,
            $u->name ?? '—',
            $u->email ?? '—',
            $u->role ?? '—',
        ])->toArray();
        return ['Rapport Utilisateurs', $headers, $rows];
    }

    private function reportSubscriptions(callable $applyFilter): array
    {
        $query = Subscription::with('user:id,name,email')->orderBy('created_at', 'desc');
        $applyFilter($query);
        $items = $query->get();
        $headers = ['Date', 'Plan', 'Client', 'Statut', 'Début', 'Expiration'];
        $rows = $items->map(fn ($s) => [
            $s->created_at?->format('d/m/Y H:i'),
            $s->plan ?? $s->subscription_plan_id ?? '—',
            $s->user?->name ?? $s->user_id,
            $s->status ?? '—',
            $s->started_at?->format('d/m/Y') ?? '—',
            $s->expires_at?->format('d/m/Y') ?? '—',
        ])->toArray();
        return ['Rapport Abonnements', $headers, $rows];
    }

    private function reportPayments(callable $applyFilter): array
    {
        $query = Payment::with('order:id,uuid', 'subscription:id,uuid')->orderBy('created_at', 'desc');
        $applyFilter($query);
        $items = $query->get();
        $headers = ['Date', 'Référence', 'Montant', 'Devise', 'Provider', 'Statut'];
        $rows = $items->map(fn ($p) => [
            $p->created_at?->format('d/m/Y H:i'),
            $p->order?->uuid ?? $p->subscription?->uuid ?? $p->id,
            number_format((float) $p->amount, 2, ',', ' '),
            $p->currency ?? 'XOF',
            $p->provider ?? '—',
            $p->status ?? '—',
        ])->toArray();
        return ['Rapport Paiements', $headers, $rows];
    }

    private function reportEventRequests(callable $applyFilter): array
    {
        $query = EventRequest::orderBy('created_at', 'desc');
        $applyFilter($query);
        $items = $query->get();
        $headers = ['Date', 'Type événement', 'Date événement', 'Convives', 'Contact', 'Statut'];
        $rows = $items->map(fn ($e) => [
            $e->created_at?->format('d/m/Y H:i'),
            $e->event_type ?? '—',
            $e->event_date?->format('d/m/Y') ?? '—',
            $e->guest_count ?? '—',
            $e->contact_name ?? $e->contact_email ?? '—',
            $e->status ?? '—',
        ])->toArray();
        return ['Rapport Demandes événementielles', $headers, $rows];
    }

    private function reportActivitySummary(?string $dateFrom, ?string $dateTo): array
    {
        $qOrders = Order::query();
        $qSubs = Subscription::query();
        $qPayments = Payment::query();
        if ($dateFrom) {
            $qOrders->where('created_at', '>=', $dateFrom);
            $qSubs->where('created_at', '>=', $dateFrom);
            $qPayments->where('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $end = $dateTo . ' 23:59:59';
            $qOrders->where('created_at', '<=', $end);
            $qSubs->where('created_at', '<=', $end);
            $qPayments->where('created_at', '<=', $end);
        }
        $headers = ['Indicateur', 'Valeur'];
        $rows = [
            ['Commandes', (string) $qOrders->count()],
            ['Abonnements', (string) $qSubs->count()],
            ['Paiements', (string) $qPayments->count()],
            ['Montant total (paiements)', number_format((float) $qPayments->sum('amount'), 2, ',', ' ') . ' FCFA'],
        ];
        return ['Synthèse d\'activité', $headers, $rows];
    }
}
