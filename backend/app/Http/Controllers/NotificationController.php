<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        try {
            $limit = (int) $request->query('limit', 20);
            $limit = max(1, min($limit, 50));

            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($n) {
                    $data = $n->data;
                    if (is_string($data)) {
                        $decoded = json_decode($data, true);
                        $data = is_array($decoded) ? $decoded : ['message' => $data];
                    }
                    if (! is_array($data)) {
                        $data = [];
                    }
                    return [
                        'id' => $n->id,
                        'type' => $n->type,
                        'data' => $data,
                        'read_at' => $n->read_at ? $n->read_at->toIso8601String() : null,
                        'created_at' => $n->created_at ? $n->created_at->toIso8601String() : null,
                    ];
                });

            $unreadCount = $user->unreadNotifications()->count();

            return response()->json([
                'unread_count' => $unreadCount,
                'notifications' => $notifications,
            ]);
        } catch (\Throwable $e) {
            Log::error('NotificationController@index', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'unread_count' => 0,
                'notifications' => [],
            ]);
        }
    }

    public function markRead(Request $request, string $id)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $notification = $user->notifications()->where('id', $id)->first();
        if (! $notification) {
            return response()->json(['message' => 'Notification introuvable'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'OK',
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $user->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'message' => 'OK',
            'unread_count' => 0,
        ]);
    }
}

