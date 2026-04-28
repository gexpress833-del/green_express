<?php

namespace App\Services;

use App\Events\CompanySubscriptionRealtimeEvent;
use App\Models\CompanySubscription;
use App\Models\Promotion;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\CompanySubscriptionLifecycleNotification;

class NotificationOrchestratorService
{
    public function __construct(private AppNotificationService $notifications)
    {
    }

    public function notifySubscription(Subscription $subscription, string $event, ?string $detail = null): void
    {
        $this->notifications->notifySubscription($subscription, $event, $detail);
    }

    public function notifyClientAndAdminsAfterSubscriptionPayment(Subscription $subscription): void
    {
        $this->notifications->notifyClientAndAdminsAfterSubscriptionPayment($subscription);
    }

    public function notifyClientAfterAdminScheduling(Subscription $subscription): void
    {
        $this->notifications->notifyClientAfterAdminScheduling($subscription);
    }

    public function notifyPromotionPublished(Promotion $promotion, bool $featured = false): void
    {
        $this->notifications->notifyPromotionPublished($promotion, $featured);
    }

    public function broadcastAnnouncement(string $title, string $message, ?User $sentBy = null): int
    {
        return $this->notifications->broadcastAnnouncement($title, $message, $sentBy);
    }

    public function notifyAdminsOperational(string $title, string $message): void
    {
        $this->notifications->notifyAdminsOperational($title, $message);
    }

    public function notifyCuisiniersOperational(string $title, string $message): void
    {
        $this->notifications->notifyCuisiniersOperational($title, $message);
    }

    public function notifyCompanySubscriptionPaymentInitiated(CompanySubscription $subscription): void
    {
        $this->notifyCompanySubscriptionLifecycle($subscription, 'payment_initiated');
    }

    public function notifyCompanySubscriptionPaymentConfirmed(CompanySubscription $subscription): void
    {
        $this->notifyCompanySubscriptionLifecycle($subscription, 'payment_confirmed');
    }

    public function notifyCompanySubscriptionPaymentFailed(CompanySubscription $subscription, ?string $reason = null): void
    {
        $this->notifyCompanySubscriptionLifecycle($subscription, 'payment_failed', $reason);
    }

    public function notifyCompanySubscriptionCancelled(CompanySubscription $subscription): void
    {
        $this->notifyCompanySubscriptionLifecycle($subscription, 'cancelled');
    }

    public function notifyCompanySubscriptionActivated(CompanySubscription $subscription): void
    {
        $this->notifyCompanySubscriptionLifecycle($subscription, 'activated');
    }

    public function notifyCompanySubscriptionExpired(CompanySubscription $subscription): void
    {
        $this->notifyCompanySubscriptionLifecycle($subscription, 'expired');
    }

    public function notifyCompanySubscriptionLifecycle(
        CompanySubscription $subscription,
        string $event,
        ?string $detail = null,
        bool $notifyAdmins = true,
        bool $notifyCompany = true,
    ): void {
        $fresh = $subscription->fresh(['company.contactUser']) ?? $subscription->loadMissing('company.contactUser');

        CompanySubscriptionRealtimeEvent::dispatch($fresh, $event, $detail);

        if ($notifyCompany) {
            $contact = $fresh->company?->contactUser;
            if ($contact && $this->canSendUniqueLifecycle($contact, $fresh, $event)) {
                $contact->notify(new CompanySubscriptionLifecycleNotification($fresh, $event, $detail));
            }
        }

        if (! $notifyAdmins) {
            return;
        }

        User::query()
            ->where('role', 'admin')
            ->orderBy('id')
            ->chunk(50, function ($admins) use ($fresh, $event, $detail): void {
                foreach ($admins as $admin) {
                    if (! $this->canSendUniqueLifecycle($admin, $fresh, $event)) {
                        continue;
                    }
                    $admin->notify(new CompanySubscriptionLifecycleNotification($fresh, $event, $detail));
                }
            });
    }

    private function canSendUniqueLifecycle(User $user, CompanySubscription $subscription, string $event): bool
    {
        $recent = $user->notifications()
            ->where('created_at', '>=', now()->subMinutes(10))
            ->where('type', CompanySubscriptionLifecycleNotification::class)
            ->latest('created_at')
            ->limit(30)
            ->get(['data']);

        foreach ($recent as $notification) {
            $data = $notification->data;
            if (! is_array($data)) {
                continue;
            }

            if (($data['kind'] ?? null) !== 'company_subscription_'.$event) {
                continue;
            }

            if ((string) ($data['company_subscription_id'] ?? '') !== (string) $subscription->id) {
                continue;
            }

            return false;
        }

        return true;
    }
}
