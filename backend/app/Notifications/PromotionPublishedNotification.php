<?php

namespace App\Notifications;

use App\Models\Promotion;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PromotionPublishedNotification extends Notification
{
    use Queueable;

    /**
     * @param  bool  $featured  true = mise en avant « promotion spéciale », false = nouvelle promotion standard
     */
    public function __construct(
        public Promotion $promotion,
        public bool $featured = false,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $p = $this->promotion;
        $title = $p->title ?: 'Nouvelle promotion';
        $kind = $this->featured ? 'special' : 'new';
        $badge = $this->featured ? 'Promotion spéciale' : 'Nouvelle promotion';

        $parts = [$badge];
        if ($p->discount != null && (float) $p->discount > 0) {
            $parts[] = '-'.(float) $p->discount.'%';
        }
        $message = implode(' · ', $parts);
        if ($p->description) {
            $desc = strlen($p->description) > 120 ? substr($p->description, 0, 120).'…' : $p->description;
            $message .= ' — '.$desc;
        }

        return [
            'category' => 'promotion',
            'kind' => 'promotion_'.$kind,
            'promotion_id' => $p->id,
            'promotion_kind' => $kind,
            'title' => $this->featured ? '⭐ '.$title : $title,
            'message' => $message,
            'image' => $p->image,
            'discount' => $p->discount,
            'origin_type' => 'system',
        ];
    }
}
