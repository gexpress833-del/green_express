<?php

namespace App\Http\Controllers;

use App\Http\Traits\AdminRequiresPermission;
use App\Models\User;
use App\Services\NotificationOrchestratorService;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    use AdminRequiresPermission;

    private function normalizeCategory(array $data): string
    {
        $category = trim((string) ($data['category'] ?? ''));
        if ($category !== '') {
            return $category;
        }

        if (! empty($data['order_id'])) {
            return 'order';
        }
        if (! empty($data['event_request_id'])) {
            return 'event';
        }
        if (! empty($data['subscription_id']) || ! empty($data['company_subscription_id'])) {
            return 'subscription';
        }
        if (! empty($data['promotion_id'])) {
            return 'promotion';
        }

        return 'announcement';
    }

    private function normalizeNotificationPayload(array $data, array $roleLabels): array
    {
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

        $title = trim((string) ($data['title'] ?? ''));
        $message = trim((string) ($data['message'] ?? ''));
        if ($title === '') {
            $title = $message !== '' ? mb_strimwidth($message, 0, 120, '…') : 'Notification';
        }

        return [
            'category' => $this->normalizeCategory($data),
            'kind' => (string) ($data['kind'] ?? 'info'),
            'severity' => (string) ($data['severity'] ?? 'info'),
            'title' => $title,
            'message' => $message,
            'origin_label' => $originLabel,
            'origin_type' => $originType,
            'order_id' => $data['order_id'] ?? null,
            'subscription_id' => $data['subscription_id'] ?? null,
            'company_subscription_id' => $data['company_subscription_id'] ?? null,
            'promotion_id' => $data['promotion_id'] ?? null,
            'event_request_id' => $data['event_request_id'] ?? null,
            'plan_name' => $data['plan_name'] ?? null,
            'deep_link' => $data['deep_link'] ?? null,
            'image_url' => $data['image_url'] ?? ($data['image'] ?? ($data['thumbnail'] ?? null)),
            'data' => $data,
        ];
    }

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
        $user = $request->user('api');
        if (! $user) {
            return response()->json([
                'unread_count' => 0,
                'notifications' => [],
            ]);
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
                'secretaire' => 'Secrétariat',
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
                    $normalized = $this->normalizeNotificationPayload($data, $roleLabels);
                    return [
                        'id' => (string) $n->id,
                        'type' => $n->type,
                        'category' => $normalized['category'],
                        'kind' => $normalized['kind'],
                        'severity' => $normalized['severity'],
                        'title' => $normalized['title'],
                        'message' => $normalized['message'],
                        'origin_label' => $normalized['origin_label'],
                        'origin_type' => $normalized['origin_type'],
                        'order_id' => $normalized['order_id'],
                        'subscription_id' => $normalized['subscription_id'],
                        'company_subscription_id' => $normalized['company_subscription_id'],
                        'promotion_id' => $normalized['promotion_id'],
                        'event_request_id' => $normalized['event_request_id'],
                        'plan_name' => $normalized['plan_name'],
                        'deep_link' => $normalized['deep_link'],
                        'image_url' => $normalized['image_url'],
                        'data' => $normalized['data'],
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
        $user = $request->user('api');
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
        $user = $request->user('api');
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
        $user = $request->user('api');
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
        $user = $request->user('api');
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
    public function broadcastAnnouncement(Request $request, NotificationOrchestratorService $notifications)
    {
        if ($r = $this->adminRequires($request, 'admin.notifications.broadcast')) {
            return $r;
        }

        $user = $request->user('api');
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $count = $notifications->broadcastAnnouncement($data['title'], $data['message'], $user);

        return response()->json([
            'message' => 'Annonce envoyée à tous les utilisateurs.',
            'users_notified' => $count,
        ]);
    }
}

