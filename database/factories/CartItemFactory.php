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
        $user = User::factory()->create();

        return [
            'cart_id'    => Cart::firstOrCreate(['user_id' => $user->id])->id,
            'product_id' => Product::factory(),
            'quantity'   => $this->faker->numberBetween(1, 5),
        ];
    }

    public function forUser(User|int $user): self
    {
        $userId = $user instanceof User ? $user->id : $user;

        return $this->state(fn () => [
            'cart_id' => Cart::firstOrCreate(['user_id' => $userId])->id,
        ]);
    }
}