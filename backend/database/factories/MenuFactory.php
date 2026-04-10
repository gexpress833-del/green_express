<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Menu>
 */
class MenuFactory extends Factory
{
    public function definition(): array
    {
        return [
            'created_by' => User::factory(),
            'title' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'image' => null,
            'price' => fake()->randomFloat(2, 5, 50),
            'currency' => 'XAF',
            'status' => 'approved',
            'available_from' => now(),
            'available_to' => now()->addMonths(1),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'pending']);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'approved']);
    }
}
