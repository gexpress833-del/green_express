<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateReportJob;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    /**
     * Liste des rapports (admin) : historique pour la page Rapports.
     */
    public function index(Request $request)
    {
        $query = Report::with('generatedByUser')->orderBy('created_at', 'desc');
        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        return $query->paginate($perPage);
    }

    public function generate(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

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

        GenerateReportJob::dispatch($report);

        return response()->json($report, 202);
    }

    /**
     * Télécharger le PDF d'un rapport (si généré).
     */
    public function download(Request $request, int $id)
    {
        $report = Report::find($id);
        if (!$report || !$report->file_path) {
            return response()->json(['message' => 'Rapport introuvable ou pas encore généré'], 404);
        }
        if (!Storage::disk('local')->exists($report->file_path)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
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
        $report = Report::find($id);
        if (!$report) {
            return response()->json(['message' => 'Rapport introuvable'], 404);
        }
        if ($report->file_path && Storage::disk('local')->exists($report->file_path)) {
            Storage::disk('local')->delete($report->file_path);
        }
        $report->delete();
        return response()->json(['message' => 'Rapport supprimé'], 200);
    }
}
