<?php

namespace App\Services;

use Pusher\PushNotifications\PushNotifications;

class BeamsService
{
    private ?PushNotifications $client = null;

    public function __construct()
    {
        $instanceId = config('beams.instance_id');
        $secretKey = config('beams.secret_key');

        if ($instanceId && $secretKey) {
            try {
                $this->client = new PushNotifications([
                    'instanceId' => $instanceId,
                    'secretKey' => $secretKey,
                ]);
            } catch (\Throwable $e) {
                \Log::warning('Pusher Beams init failed, push notifications disabled', [
                    'error' => $e->getMessage(),
                ]);
                $this->client = null;
            }
        }
    }

    /**
     * Envoie une notification push aux utilisateurs ciblés.
     *
     * @param  array<string, mixed>  $interests
     * @param  array{title: string, body: string, deep_link?: string, badge?: int}  $notification
     */
    public function sendToInterests(array $interests, array $notification): void
    {
        if (! $this->client) {
            return;
        }

        $badge = isset($notification['badge']) ? max(0, (int) $notification['badge']) : null;

        $apns = [
            'aps' => [
                'alert' => [
                    'title' => $notification['title'],
                    'body' => $notification['body'],
                ],
                'sound' => 'default',
            ],
        ];
        if ($badge !== null) {
            $apns['aps']['badge'] = $badge;
        }

        try {
            $this->client->publishToInterests($interests, [
                'web' => [
                    'notification' => [
                        'title' => $notification['title'],
                        'body' => $notification['body'],
                        'deep_link' => $notification['deep_link'] ?? null,
                    ],
                    'data' => array_filter([
                        'deep_link' => $notification['deep_link'] ?? null,
                        'unread_count' => $badge,
                    ], fn ($v) => $v !== null),
                ],
                'apns' => $apns,
                'fcm' => [
                    'notification' => [
                        'title' => $notification['title'],
                        'body' => $notification['body'],
                        'sound' => 'default',
                    ],
                    'data' => array_filter([
                        'deep_link' => $notification['deep_link'] ?? null,
                        'unread_count' => $badge !== null ? (string) $badge : null,
                    ]),
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Pusher Beams send failed', [
                'interests' => $interests,
                'notification' => $notification,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Envoie une notification push à un utilisateur spécifique (par son ID externe).
     *
     * @param  int|string  $userId
     * @param  array{title: string, body: string, deep_link?: string}  $notification
     */
    public function sendToUser(int|string $userId, array $notification): void
    {
        $this->sendToInterests([(string) $userId], $notification);
    }

    /**
     * Envoie une notification push à tous les admins.
     *
     * @param  array{title: string, body: string, deep_link?: string}  $notification
     */
    public function sendToAdmins(array $notification): void
    {
        $this->sendToInterests(['admins'], $notification);
    }

    /**
     * Envoie une notification push à tous les livreurs.
     *
     * @param  array{title: string, body: string, deep_link?: string}  $notification
     */
    public function sendToLivreurs(array $notification): void
    {
        $this->sendToInterests(['livreurs'], $notification);
    }
}
