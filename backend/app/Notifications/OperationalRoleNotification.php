<?php

namespace App\Notifications;

use App\Support\NotificationDeepLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OperationalRoleNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public string $category = 'operational',
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'category' => $this->category,
            'kind' => 'operational_digest',
            'title' => $this->title,
            'message' => $this->message,
            'deep_link' => NotificationDeepLink::forOperational($notifiable),
            'origin_type' => 'system',
        ];
    }
}
