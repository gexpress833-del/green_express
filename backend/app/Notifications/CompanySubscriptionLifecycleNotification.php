<?php

namespace App\Notifications;

use App\Models\CompanySubscription;
use App\Support\NotificationDeepLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CompanySubscriptionLifecycleNotification extends Notification
{
    use Queueable;

    public function __construct(
        public CompanySubscription $subscription,
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
        $companyName = $sub->company?->name ?? 'Entreprise';

        [$title, $message, $severity] = match ($this->event) {
            'payment_initiated' => [
                'Paiement abonnement initié',
                "Le paiement de l’abonnement entreprise ({$companyName}) a été initié.",
                'info',
            ],
            'payment_confirmed' => [
                'Paiement abonnement confirmé',
                "Le paiement de l’abonnement entreprise ({$companyName}) est confirmé.",
                'success',
            ],
            'payment_failed' => [
                'Paiement abonnement échoué',
                $this->detail
                    ? "Le paiement a échoué : {$this->detail}"
                    : "Le paiement de l’abonnement entreprise ({$companyName}) n’a pas abouti.",
                'warning',
            ],
            'cancelled' => [
                'Demande d’abonnement annulée',
                "La demande d’abonnement entreprise ({$companyName}) a été annulée.",
                'warning',
            ],
            'activated' => [
                'Abonnement entreprise activé',
                "L’abonnement entreprise ({$companyName}) est maintenant actif.",
                'success',
            ],
            'expired' => [
                'Abonnement entreprise expiré',
                "L’abonnement entreprise ({$companyName}) est arrivé à expiration.",
                'warning',
            ],
            default => [
                'Abonnement entreprise',
                'Mise à jour concernant votre abonnement entreprise.',
                'info',
            ],
        };

        return [
            'category' => 'subscription',
            'kind' => 'company_subscription_'.$this->event,
            'company_subscription_id' => $sub->id,
            'deep_link' => NotificationDeepLink::forCompanySubscription($notifiable, $sub->id),
            'status' => $sub->status,
            'payment_status' => $sub->payment_status,
            'title' => $title,
            'message' => $message,
            'severity' => $severity,
            'origin_type' => 'system',
        ];
    }
}
