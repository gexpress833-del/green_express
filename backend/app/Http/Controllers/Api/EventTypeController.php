<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\AdminRequiresPermission;
use App\Models\EventType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventTypeController extends Controller
{
    use AdminRequiresPermission;

    public function index(Request $request): JsonResponse
    {
        $query = EventType::orderBy('sort_order');

        if ($request->boolean('include_inactive')) {
            $user = $request->user();
            if (! $user || ! $user->canAsAdmin('admin.event-types')) {
                $query->where('is_active', true);
            }
        } else {
            $query->where('is_active', true);
        }

        $eventTypes = $query->get()->map(fn ($type) => [
            'id' => $type->id,
            'title' => $type->title,
            'description' => $type->description,
            'is_active' => $type->is_active,
            'sort_order' => $type->sort_order,
        ]);

        return response()->json([
            'success' => true,
            'data' => $eventTypes,
        ]);
    }

    public function show($id): JsonResponse
    {
        $eventType = EventType::find($id);

        if (! $eventType) {
            return response()->json([
                'success' => false,
                'message' => 'Type d\'événement non trouvé',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $eventType->id,
                'title' => $eventType->title,
                'description' => $eventType->description,
                'is_active' => $eventType->is_active,
                'sort_order' => $eventType->sort_order,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($r = $this->adminRequires($request, 'admin.event-types')) {
            return $r;
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:event_types,title',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $eventType = EventType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Type d\'événement créé avec succès',
            'data' => [
                'id' => $eventType->id,
                'title' => $eventType->title,
                'description' => $eventType->description,
                'is_active' => $eventType->is_active,
                'sort_order' => $eventType->sort_order,
            ],
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        if ($r = $this->adminRequires($request, 'admin.event-types')) {
            return $r;
        }

        $eventType = EventType::find($id);

        if (! $eventType) {
            return response()->json([
                'success' => false,
                'message' => 'Type d\'événement non trouvé',
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'string|max:255|unique:event_types,title,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $eventType->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Type d\'événement modifié avec succès',
            'data' => [
                'id' => $eventType->id,
                'title' => $eventType->title,
                'description' => $eventType->description,
                'is_active' => $eventType->is_active,
                'sort_order' => $eventType->sort_order,
            ],
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        if ($r = $this->adminRequires($request, 'admin.event-types')) {
            return $r;
        }

        $eventType = EventType::find($id);

        if (! $eventType) {
            return response()->json([
                'success' => false,
                'message' => 'Type d\'événement non trouvé',
            ], 404);
        }

        $eventType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Type d\'événement supprimé avec succès',
        ]);
    }
}
