<?php

namespace App\Notifications;

use App\Models\EventRequest;
use App\Support\NotificationDeepLink;
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
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $this->eventRequest->loadMissing('respondedByUser');
        $admin = $this->eventRequest->respondedByUser;
        $response = trim((string) ($this->eventRequest->admin_response ?? ''));
        $status = (string) $this->eventRequest->status;
        $eventType = (string) $this->eventRequest->event_type;
        $contacted = $status === 'contacted';

        $title = $contacted
            ? 'Green Express vous a contacté'
            : 'Mise à jour de votre demande événementielle';

        $message = $response !== ''
            ? (strlen($response) > 120 ? substr($response, 0, 120).'…' : $response)
            : ($contacted
                ? "Nous avons pris en charge votre demande{$eventType !== '' ? " ({$eventType})" : ''}. Consultez le détail dans vos demandes événementielles."
                : 'Votre demande de devis a été clôturée. Consultez le détail dans vos demandes événementielles.');

        return [
            'category' => 'event',
            'kind' => 'event_request_responded',
            'event_request_id' => $this->eventRequest->id,
            'deep_link' => NotificationDeepLink::forEventRequest($notifiable),
            'event_type' => $eventType,
            'status' => $status,
            'admin_response' => $response,
            'responded_at' => optional($this->eventRequest->responded_at)?->toIso8601String(),
            'title' => $title,
            'message' => $message,
            'severity' => $contacted ? 'success' : 'info',
            'origin_type' => 'admin',
            'origin_user_id' => $admin?->id,
            'origin_user_name' => $admin?->name ?? 'Green Express',
        ];
    }
}
