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
            $this->client = new PushNotifications([
                'instance_id' => $instanceId,
                'secret_key' => $secretKey,
            ]);
        }
    }

    /**
     * Envoie une notification push aux utilisateurs ciblés.
     *
     * @param  array<string, mixed>  $interests
     * @param  array{title: string, body: string, deep_link?: string}  $notification
     */
    public function sendToInterests(array $interests, array $notification): void
    {
        if (! $this->client) {
            return;
        }

        try {
            $this->client->publishToInterests($interests, [
                'web' => [
                    'notification' => [
                        'title' => $notification['title'],
                        'body' => $notification['body'],
                        'deep_link' => $notification['deep_link'] ?? null,
                    ],
                ],
                'apns' => [
                    'aps' => [
                        'alert' => [
                            'title' => $notification['title'],
                            'body' => $notification['body'],
                        ],
                        'sound' => 'default',
                    ],
                ],
                'fcm' => [
                    'notification' => [
                        'title' => $notification['title'],
                        'body' => $notification['body'],
                        'sound' => 'default',
                    ],
                    'data' => array_filter([
                        'deep_link' => $notification['deep_link'] ?? null,
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
