<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);
        $slug = Str::slug($name);
        return [
            'name'        => ucfirst($name),
            'slug'        => $slug,
            'sku'         => strtoupper(Str::random(8)),
            'description' => $this->faker->sentence(),
            'image_path'  => "https://picsum.photos/seed/{$slug}/800/800",
            'price'       => $this->faker->randomFloat(2, 5, 500),
            'stock'       => $this->faker->numberBetween(0, 100),
            'is_active'   => true,
        ];
    }
}