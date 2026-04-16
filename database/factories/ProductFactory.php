<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);
        return [
            'name'        => ucfirst($name),
            'slug'        => Str::slug($name),
            'sku'         => strtoupper(Str::random(8)),  // ← add this
            'description' => $this->faker->sentence(),
            'price'       => $this->faker->randomFloat(2, 5, 500),
            'stock'       => $this->faker->numberBetween(0, 100),
            'is_active'   => true,
        ];
    }
}