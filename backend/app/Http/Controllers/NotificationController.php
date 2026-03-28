<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AppNotificationService;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Résout une notification par clé primaire et vérifie qu’elle appartient à l’utilisateur.
     * (Compat notifiable_type : App\Models\User vs App\User, etc.)
     */
    private function findNotificationForUser(User $user, string $id): ?DatabaseNotification
    {
        $id = trim(urldecode($id));
        if ($id === '') {
            return null;
        }

        $notification = DatabaseNotification::query()->whereKey($id)->first();
        if (! $notification && strlen($id) === 36) {
            $notification = DatabaseNotification::query()
                ->whereRaw('LOWER(id) = ?', [strtolower($id)])
                ->first();
        }
        if (! $notification) {
            return null;
        }

        if ((string) $notification->notifiable_id !== (string) $user->getKey()) {
            return null;
        }

        $allowedTypes = array_unique(array_filter([
            $user->getMorphClass(),
            User::class,
            'App\\User',
        ]));

        if (! in_array($notification->notifiable_type, $allowedTypes, true)) {
            return null;
        }

        return $notification;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        try {
            $limit = (int) $request->query('limit', 20);
            $limit = max(1, min($limit, 50));

            $roleLabels = [
                'client' => 'Client',
                'admin' => 'Administration',
                'livreur' => 'Livreur',
                'verificateur' => 'Vérificateur',
                'cuisinier' => 'Cuisinier',
                'entreprise' => 'Entreprise',
                'system' => 'Système',
            ];
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($n) use ($roleLabels) {
                    $data = $n->data;
                    if (is_string($data)) {
                        $decoded = json_decode($data, true);
                        $data = is_array($decoded) ? $decoded : ['message' => $data];
                    }
                    if (! is_array($data)) {
                        $data = [];
                    }
                    $originType = $data['origin_type'] ?? null;
                    $originName = $data['origin_user_name'] ?? null;
                    $originLabel = null;
                    if ($originName) {
                        $roleLabel = $roleLabels[$originType] ?? $originType;
                        $originLabel = "{$originName} ({$roleLabel})";
                    } elseif ($originType) {
                        $originLabel = $roleLabels[$originType] ?? $originType;
                    }
                    $data['origin_label'] = $originLabel;
                    return [
                        'id' => (string) $n->id,
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

        $notification = $this->findNotificationForUser($user, $id);
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

    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $notification = $this->findNotificationForUser($user, $id);
        if (! $notification) {
            return response()->json(['message' => 'Notification introuvable'], 404);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification supprimée',
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function destroyAll(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $deletedCount = $user->notifications()->count();
        $user->notifications()->delete();

        return response()->json([
            'message' => 'Notifications supprimées',
            'deleted_count' => $deletedCount,
            'unread_count' => 0,
        ]);
    }

    /**
     * Admin : diffuser une annonce à tous les utilisateurs (Green Express).
     */
    public function broadcastAnnouncement(Request $request, AppNotificationService $appNotifications)
    {
        $user = $request->user();
        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $count = $appNotifications->broadcastAnnouncement($data['title'], $data['message'], $user);

        return response()->json([
            'message' => 'Annonce envoyée à tous les utilisateurs.',
            'users_notified' => $count,
        ]);
    }
}

