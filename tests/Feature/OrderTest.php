<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private function placeOrder(User $user): array
    {
        $product = Product::factory()->create([
            'price' => 40.00,
            'stock' => 5,
        ]);

        CartItem::factory()->forUser($user)->create([
            'product_id' => $product->id,
            'quantity'   => 1,
        ]);

        return $this->actingAs($user)
            ->withHeader('Idempotency-Key', uniqid('order-', true))
            ->postJson('/api/v1/checkout')
            ->assertCreated()
            ->json('data');
    }

    public function test_user_can_list_orders(): void
    {
        $user = User::factory()->create();
        $order = $this->placeOrder($user);

        $this->actingAs($user)
            ->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $order['id']);
    }

    public function test_user_can_view_single_order(): void
    {
        $user = User::factory()->create();
        $order = $this->placeOrder($user);

        $this->actingAs($user)
            ->getJson('/api/v1/orders/'.$order['id'])
            ->assertOk()
            ->assertJsonPath('data.id', $order['id']);
    }
}