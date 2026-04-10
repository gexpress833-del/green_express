<?php

namespace App\Http\Controllers;

use App\Http\Traits\AdminRequiresPermission;
use App\Jobs\GenerateReportJob;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    use AdminRequiresPermission;

    /**
     * Liste des rapports (admin) : historique pour la page Rapports.
     */
    public function index(Request $request)
    {
        if ($r = $this->adminRequires($request, 'admin.reports')) {
            return $r;
        }

        $query = Report::with('generatedByUser')->orderBy('created_at', 'desc');
        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        return $query->paginate($perPage);
    }

    public function generate(Request $request)
    {
        if ($r = $this->adminRequires($request, 'admin.reports')) {
            return $r;
        }

        $user = $request->user();

        $data = $request->validate([
            'type' => 'required|string|in:orders,users,subscriptions,payments,event_requests,activity_summary',
            'params' => 'nullable|array',
            'params.date_from' => 'nullable|date',
            'params.date_to' => 'nullable|date|after_or_equal:params.date_from',
        ]);

        $params = array_merge($data['params'] ?? [], ['type' => $data['type'], 'format' => 'pdf']);
        $report = Report::create([
            'generated_by' => $user->id,
            'params' => $params,
            'status' => 'queued',
        ]);

        $job = new GenerateReportJob($report);
        $job->handle();

        return response()->json($report->fresh(), 200);
    }

    /**
     * Télécharger le PDF d'un rapport (si généré).
     */
    public function download(Request $request, int $id)
    {
        if ($r = $this->adminRequires($request, 'admin.reports')) {
            return $r;
        }

        $report = Report::find($id);
        if (! $report) {
            return response()->json(['message' => 'Rapport introuvable'], 404);
        }

        if (! $report->file_path) {
            return response()->json(['message' => 'Rapport pas encore généré (file_path manquant)'], 404);
        }

        $disk = Storage::disk('local');
        if (! $disk->exists($report->file_path)) {
            try {
                $report->update(['status' => 'processing']);
                $job = new GenerateReportJob($report);
                $job->handle();
                $report->refresh();
            } catch (\Throwable $e) {
            }

            if (! $report->file_path || ! $disk->exists($report->file_path)) {
                return response()->json([
                    'message' => 'Fichier introuvable après régénération. Réessayez plus tard.',
                ], 404);
            }
        }

        $typeLabel = $report->params['type'] ?? 'rapport';
        $filename = 'rapport-' . $typeLabel . '-' . $report->id . '.pdf';

        return Storage::disk('local')->download($report->file_path, $filename, ['Content-Type' => 'application/pdf']);
    }

    /**
     * Supprimer un rapport de l'historique (admin).
     */
    public function destroy(Request $request, int $id)
    {
        if ($r = $this->adminRequires($request, 'admin.reports')) {
            return $r;
        }

        $report = Report::find($id);
        if (! $report) {
            return response()->json(['message' => 'Rapport introuvable'], 404);
        }
        if ($report->file_path && Storage::disk('local')->exists($report->file_path)) {
            Storage::disk('local')->delete($report->file_path);
        }
        $report->delete();

        return response()->json(['message' => 'Rapport supprimé'], 200);
    }
}
