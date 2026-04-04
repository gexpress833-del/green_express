<?php

namespace App\Http\Controllers;

use App\Http\Traits\AdminRequiresPermission;
use App\Models\EventRequest;
use App\Notifications\EventRequestRespondedNotification;
use Illuminate\Http\Request;

class EventRequestController extends Controller
{
    use AdminRequiresPermission;

    /**
     * Enregistrer une demande de devis événementiel (client connecté obligatoire).
     * Nom et email sont pris du compte connecté.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Vous devez être connecté pour soumettre une demande.'], 401);
        }

        $validated = $request->validate([
            'event_type' => 'required|string|max:100',
            'event_date' => 'required|date',
            'guest_count' => 'required|integer|min:1|max:50000',
            'budget' => 'nullable|string|max:100',
            'message' => 'nullable|string|max:2000',
            'contact_phone' => 'nullable|string|max:50',
        ]);

        $eventRequest = EventRequest::create([
            'event_type' => $validated['event_type'],
            'event_date' => $validated['event_date'],
            'guest_count' => (int) $validated['guest_count'],
            'budget' => $validated['budget'] ?? null,
            'message' => $validated['message'] ?? null,
            'contact_name' => $user->name,
            'contact_email' => $user->email,
            'contact_phone' => $validated['contact_phone'] ?? null,
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Demande enregistrée. Green Express vous recontactera sous 48 h.',
            'id' => $eventRequest->id,
        ], 201);
    }

    /**
     * Liste des demandes événementielles (admin uniquement).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }
        if ($r = $this->adminRequires($request, 'admin.event-requests')) {
            return $r;
        }

        $list = EventRequest::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($er) => $this->formatEventRequest($er));

        return response()->json($list);
    }

    /**
     * Traiter une demande (admin) : statut + réponse. Le client est notifié.
     */
    public function update(Request $request, int $id)
    {
        if ($r = $this->adminRequires($request, 'admin.event-requests')) {
            return $r;
        }

        $admin = $request->user();
        $eventRequest = EventRequest::find($id);
        if (! $eventRequest) {
            return response()->json(['message' => 'Demande introuvable'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:contacted,closed',
            'admin_response' => 'required|string|max:2000',
        ]);

        $eventRequest->update([
            'status' => $validated['status'],
            'admin_response' => $validated['admin_response'],
            'responded_at' => now(),
            'responded_by' => $admin->id,
        ]);

        if ($eventRequest->user_id) {
            $eventRequest->user->notify(new EventRequestRespondedNotification($eventRequest));
        }

        return response()->json([
            'message' => 'Demande traitée. Le client a été notifié.',
            'event_request' => $this->formatEventRequest($eventRequest->fresh(['user:id,name,email'])),
        ]);
    }

    /**
     * Mes demandes événementielles (client connecté).
     */
    public function myRequests(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $list = EventRequest::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($er) => $this->formatEventRequest($er));

        return response()->json($list);
    }

    private function formatEventRequest(EventRequest $er): array
    {
        return [
            'id' => $er->id,
            'event_type' => $er->event_type,
            'event_date' => $er->event_date->format('Y-m-d'),
            'guest_count' => $er->guest_count,
            'budget' => $er->budget,
            'message' => $er->message,
            'contact_name' => $er->contact_name,
            'contact_email' => $er->contact_email,
            'contact_phone' => $er->contact_phone,
            'status' => $er->status,
            'admin_response' => $er->admin_response,
            'responded_at' => $er->responded_at?->toIso8601String(),
            'user' => $er->user ? ['id' => $er->user->id, 'name' => $er->user->name, 'email' => $er->user->email] : null,
            'created_at' => $er->created_at->toIso8601String(),
        ];
    }
}
