<?php

namespace Database\Factories;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Promotion>
 */
class PromotionFactory extends Factory
{
    public function definition(): array
    {
        $startAt = now()->subDay();
        $endAt = now()->addDays(7);

        return [
            'admin_id' => User::factory(),
            'menu_id' => Menu::factory(),
            'points_required' => 50,
            'discount' => 10.0,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'quantity_limit' => 10,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'start_at' => now()->subDay(),
            'end_at' => now()->addDay(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'start_at' => now()->subDays(2),
            'end_at' => now()->subDay(),
        ]);
    }
}
