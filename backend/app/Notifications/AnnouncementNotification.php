<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Annonce globale Green Express — un même message pour tous les utilisateurs.
 */
class AnnouncementNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public ?User $sentBy = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $originType = 'admin';
        $originUserId = null;
        $originUserName = null;
        if ($this->sentBy) {
            $originUserId = $this->sentBy->id;
            $originUserName = $this->sentBy->name;
        }

        return [
            'category' => 'announcement',
            'kind' => 'announcement',
            'title' => $this->title,
            'message' => $this->message,
            'origin_type' => $originType,
            'origin_user_id' => $originUserId,
            'origin_user_name' => $originUserName,
        ];
    }
}
