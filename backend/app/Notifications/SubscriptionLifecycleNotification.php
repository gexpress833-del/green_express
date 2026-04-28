<?php

namespace App\Notifications;

use App\Models\Subscription;
use App\Support\NotificationDeepLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SubscriptionLifecycleNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Subscription $subscription,
        public string $event,
        public ?string $detail = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $sub = $this->subscription;
        $plan = $sub->plan ?? 'Abonnement';

        [$title, $message] = match ($this->event) {
            'pending' => [
                'Demande d’abonnement enregistrée',
                "Votre demande pour le plan « {$plan} » est en attente de validation après paiement.",
            ],
            'scheduled' => [
                'Abonnement planifié',
                'Paiement confirmé. Votre abonnement démarre à la prochaine date ouvrée indiquée sur votre espace.',
            ],
            'admin_scheduled' => [
                'Abonnement planifié pour vous',
                "Un abonnement « {$plan} » a été enregistré : il démarre à la prochaine date ouvrée.",
            ],
            'activated' => [
                'Abonnement actif',
                "Votre abonnement « {$plan} » est maintenant actif.",
            ],
            'validated' => [
                'Abonnement activé',
                "Votre abonnement « {$plan} » est maintenant actif.",
            ],
            'rejected' => [
                'Demande d’abonnement refusée',
                $this->detail
                    ? 'Motif : '.$this->detail
                    : 'Votre demande d’abonnement n’a pas été acceptée.',
            ],
            'admin_created' => [
                'Abonnement activé pour vous',
                "Un abonnement « {$plan} » a été activé sur votre compte.",
            ],
            'paused' => [
                'Abonnement mis en pause',
                "Votre abonnement « {$plan} » a été mis en pause.",
            ],
            'resumed' => [
                'Abonnement repris',
                "Votre abonnement « {$plan} » est de nouveau actif.",
            ],
            'cancelled' => [
                'Abonnement annulé',
                "Votre abonnement « {$plan} » a été annulé.",
            ],
            'starts_tomorrow' => [
                'Votre abonnement démarre demain',
                "Le plan « {$plan} » : préparez-vous pour le premier jour de repas demain.",
            ],
            'expires_tomorrow' => [
                'Votre abonnement expire demain',
                "Le plan « {$plan} » se termine demain — renouvelez maintenant pour ne pas interrompre le service.",
            ],
            'expired' => [
                'Votre abonnement a expiré',
                "Le plan « {$plan} » n’est plus actif — réabonnez-vous depuis votre espace client.",
            ],
            default => [
                'Abonnement',
                'Mise à jour concernant votre abonnement.',
            ],
        };

        return [
            'category' => 'subscription',
            'kind' => 'subscription_'.$this->event,
            'subscription_id' => $sub->id,
            'subscription_uuid' => $sub->uuid,
            'deep_link' => NotificationDeepLink::forSubscription($notifiable),
            'plan_name' => $plan,
            'status' => $sub->status,
            'title' => $title,
            'message' => $message,
            'origin_type' => 'system',
        ];
    }
}
