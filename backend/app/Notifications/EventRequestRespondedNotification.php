<?php

namespace App\Notifications;

use App\Models\EventRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EventRequestRespondedNotification extends Notification
{
    use Queueable;

    public function __construct(public EventRequest $eventRequest)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $this->eventRequest->loadMissing('respondedByUser');
        $admin = $this->eventRequest->respondedByUser;
        $response = $this->eventRequest->admin_response ?? '';
        return [
            'category' => 'event',
            'kind' => 'event_request_responded',
            'event_request_id' => $this->eventRequest->id,
            'event_type' => $this->eventRequest->event_type,
            'status' => $this->eventRequest->status,
            'admin_response' => $response,
            'responded_at' => optional($this->eventRequest->responded_at)?->toIso8601String(),
            'title' => 'Réponse à votre demande événementielle',
            'message' => strlen($response) > 80 ? substr($response, 0, 80) . '…' : $response,
            'origin_type' => 'admin',
            'origin_user_id' => $admin?->id,
            'origin_user_name' => $admin?->name ?? 'Administration',
        ];
    }
}
