<?php

namespace Database\Factories;

use App\Models\Cart;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CartItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'    => User::factory(),
            'cart_id'    => fn (array $attributes) => Cart::firstOrCreate(['user_id' => $attributes['user_id']])->id,
            'product_id' => Product::factory(),
            'quantity'   => $this->faker->numberBetween(1, 5),
        ];
    }
}