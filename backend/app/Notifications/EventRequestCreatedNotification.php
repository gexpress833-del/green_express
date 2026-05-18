<?php

namespace App\Notifications;

use App\Models\EventRequest;
use App\Support\NotificationDeepLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EventRequestCreatedNotification extends Notification
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
        $this->eventRequest->loadMissing('user');
        $client = $this->eventRequest->user;
        $eventType = (string) $this->eventRequest->event_type;
        $guestCount = (int) $this->eventRequest->guest_count;
        $dateLabel = optional($this->eventRequest->event_date)?->format('d/m/Y') ?? '';

        $summary = trim("{$eventType} — {$guestCount} personne".($guestCount > 1 ? 's' : ''));
        if ($dateLabel !== '') {
            $summary .= " · {$dateLabel}";
        }

        $clientName = $this->eventRequest->contact_name
            ?: ($client?->name ?? 'Client');

        return [
            'category' => 'event',
            'kind' => 'event_request_created',
            'event_request_id' => $this->eventRequest->id,
            'deep_link' => NotificationDeepLink::forEventRequest($notifiable),
            'event_type' => $eventType,
            'status' => 'pending',
            'guest_count' => $guestCount,
            'event_date' => optional($this->eventRequest->event_date)?->format('Y-m-d'),
            'title' => 'Nouvelle demande de devis événementiel',
            'message' => "{$clientName} : {$summary}",
            'severity' => 'info',
            'origin_type' => 'client',
            'origin_user_id' => $client?->id,
            'origin_user_name' => $clientName,
        ];
    }
}
