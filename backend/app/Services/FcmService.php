<?php

namespace App\Services;

use App\Models\User;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FcmService
{
    private ?Messaging $messaging = null;

    public function __construct()
    {
        try {
            $factory = new Factory();

            // 1. Source prioritaire en prod : JSON inline dans les variables d'environnement
            $json = config('services.firebase.credentials_json');
            if ($json) {
                // Decode si encodé en base64 pour éviter des soucis de sauts de ligne
                if (str_starts_with(trim($json), '{') === false) {
                    $json = base64_decode($json);
                }
                $factory = $factory->withServiceAccount(json_decode($json, true));
            } else {
                // 2. Fallback local : chemin physique vers le fichier
                $path = config('services.firebase.credentials_path');
                if (file_exists($path)) {
                    $factory = $factory->withServiceAccount($path);
                } else {
                    \Log::warning('Firebase credentials file not found, FCM notifications disabled. Expected path: ' . $path);
                    return;
                }
            }

            $projectId = config('services.firebase.project_id');
            if ($projectId) {
                $factory = $factory->withProjectId($projectId);
            }

            $this->messaging = $factory->createMessaging();
        } catch (\Throwable $e) {
            \Log::error('FCM: Failed to initialize Firebase Factory', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Envoie un message push à une liste de tokens.
     *
     * @param array<string> $tokens
     * @param array{title: string, body: string, deep_link?: string, badge?: int} $notification
     */
    public function sendToTokens(array $tokens, array $notification): array
    {
        if (!$this->messaging || empty($tokens)) {
            return ['success' => 0, 'failure' => 0];
        }

        // Nettoyer les tokens vides
        $tokens = array_filter(array_unique($tokens));
        if (empty($tokens)) {
            return ['success' => 0, 'failure' => 0];
        }

        $title = $notification['title'] ?? 'Green Express';
        $body = $notification['body'] ?? '';
        $deepLink = $notification['deep_link'] ?? null;
        $badge = isset($notification['badge']) ? (string) max(0, (int) $notification['badge']) : null;

        // Préparation du payload
        $payload = [
            'notification' => Notification::create($title, $body),
            'data' => array_filter([
                'deep_link' => $deepLink,
                'unread_count' => $badge,
            ], fn($v) => $v !== null),
            'android' => [
                // 'high' : réveille Android même en Doze mode → notif visible écran verrouillé.
                'priority' => 'high',
                'notification' => array_filter([
                    'title' => $title,
                    'body' => $body,
                    'icon' => 'icon-192',
                    'click_action' => $deepLink,
                    'channel_id' => 'green-express-default',
                    'default_sound' => true,
                    'default_vibrate_timings' => true,
                ]),
            ],
            'webpush' => [
                // 'Urgency: high' demande au push service (FCM/Mozilla) de livrer immédiatement,
                // sans attendre que le device sorte de veille.
                'headers' => [
                    'Urgency' => 'high',
                    'TTL' => '86400',
                ],
                'notification' => array_filter([
                    'title' => $title,
                    'body' => $body,
                    'icon' => '/icons/icon-192.png',
                    'badge' => '/icons/icon-192.png',
                    'click_action' => $deepLink,
                    'tag' => $deepLink ?: 'green-express',
                    'renotify' => true,
                    'requireInteraction' => true,
                    'vibrate' => [200, 100, 200],
                ]),
                'fcm_options' => array_filter([
                    'link' => $deepLink,
                ]),
            ],
            'apns' => [
                'headers' => [
                    'apns-priority' => '10',
                ],
                'payload' => [
                    'aps' => [
                        'sound' => 'default',
                        'mutable-content' => 1,
                    ],
                ],
            ],
        ];

        $message = CloudMessage::fromArray($payload);

        $successCount = 0;
        $failureCount = 0;
        $invalidTokens = [];

        // Envoi par lot (Multicast) pour optimiser les performances
        try {
            $report = $this->messaging->sendMulticast($message, $tokens);
            
            $successCount = $report->successes()->count();
            $failureCount = $report->failures()->count();

            // Gestion des jetons expirés ou invalides pour les nettoyer
            foreach ($report->failures() as $failure) {
                $targetToken = $failure->target()->value();
                $invalidTokens[] = $targetToken;

                \Log::debug('FCM token failure details', [
                    'token' => substr($targetToken, 0, 15) . '...',
                    'error' => $failure->error()->getMessage(),
                ]);
            }

            if (!empty($invalidTokens)) {
                $this->cleanupTokens($invalidTokens);
            }

        } catch (\Throwable $e) {
            \Log::error('FCM send failure', [
                'error' => $e->getMessage(),
                'tokens_count' => count($tokens),
            ]);
        }

        return [
            'success' => $successCount,
            'failure' => $failureCount,
        ];
    }

    /**
     * Envoie une notification push à un utilisateur spécifique (sur tous ses terminaux enregistrés).
     *
     * @param User|int|string $user
     * @param array{title: string, body: string, deep_link?: string, badge?: int} $notification
     */
    public function sendToUser(User|int|string $user, array $notification): array
    {
        $userId = $user instanceof User ? $user->id : $user;
        $tokens = \DB::table('fcm_tokens')
            ->where('user_id', $userId)
            ->pluck('token')
            ->toArray();

        return $this->sendToTokens($tokens, $notification);
    }

    /**
     * Envoie une notification push à un groupe de rôles.
     *
     * @param string $role
     * @param array{title: string, body: string, deep_link?: string, badge?: int} $notification
     */
    public function sendToRole(string $role, array $notification): array
    {
        $tokens = \DB::table('fcm_tokens')
            ->join('users', 'users.id', '=', 'fcm_tokens.user_id')
            ->where('users.role', $role)
            ->pluck('fcm_tokens.token')
            ->toArray();

        return $this->sendToTokens($tokens, $notification);
    }

    /**
     * Supprime les jetons invalides de la base de données.
     */
    private function cleanupTokens(array $tokens): void
    {
        try {
            \DB::table('fcm_tokens')->whereIn('token', $tokens)->delete();
            \Log::info('FCM: Cleaned up expired/invalid tokens', ['count' => count($tokens)]);
        } catch (\Throwable $e) {
            \Log::warning('FCM: Cleanup of invalid tokens failed', ['error' => $e->getMessage()]);
        }
    }
}
