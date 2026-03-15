<?php

namespace Database\Seeders;

use App\Models\EventType;
use Illuminate\Database\Seeder;

class EventTypeSeeder extends Seeder
{
    public function run(): void
    {
        $eventTypes = [
            ['title' => 'Conférences', 'description' => 'Pause déjeuner et collations pour vos participants.', 'sort_order' => 0],
            ['title' => 'Mariages', 'description' => 'Buffets et formules sur mesure pour votre réception.', 'sort_order' => 1],
            ['title' => 'Réunions professionnelles', 'description' => 'Traiteur pour séminaires et réunions.', 'sort_order' => 2],
            ['title' => 'Événements privés', 'description' => 'Anniversaires, fêtes, cocktails.', 'sort_order' => 3],
        ];

        foreach ($eventTypes as $type) {
            EventType::firstOrCreate(
                ['title' => $type['title']],
                ['description' => $type['description'], 'sort_order' => $type['sort_order'], 'is_active' => true]
            );
        }
    }
}
