<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification de réinitialisation de mot de passe.
 * Le lien pointe vers le frontend Next.js (/login/reset?token=...&email=...).
 */
class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $token,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
        $email = urlencode($notifiable->getEmailForPasswordReset());
        $url = "{$frontendUrl}/login/reset?token={$this->token}&email={$email}";

        return (new MailMessage)
            ->subject('Réinitialisation de votre mot de passe — ' . config('app.name'))
            ->greeting('Bonjour !')
            ->line('Vous recevez cet e-mail car nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.')
            ->action('Réinitialiser le mot de passe', $url)
            ->line('Ce lien expirera dans 60 minutes.')
            ->line('Si vous n\'avez pas fait cette demande, aucune action n\'est requise.')
            ->salutation('L\'équipe ' . config('app.name'));
    }
}
