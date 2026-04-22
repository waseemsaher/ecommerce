<?php

namespace Tests\Feature;

use App\Events\OrderPlaced;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function createCartItem(User $user, Product $product, int $quantity): void
    {
        CartItem::factory()->forUser($user)->create([
            'product_id' => $product->id,
            'quantity'   => $quantity,
        ]);
    }

    public function test_checkout_creates_order_and_clears_cart(): void
    {
        Event::fake([OrderPlaced::class]);

        $user = User::factory()->create();
        $product = Product::factory()->create([
            'price' => 25.00,
            'stock' => 5,
        ]);

        $this->createCartItem($user, $product, 2);

        $response = $this->actingAs($user)
            ->withHeader('Idempotency-Key', 'checkout-1')
            ->postJson('/api/v1/checkout');

        $response->assertCreated()
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.items.0.product.id', $product->id);

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'quantity'   => 2,
            'price'      => '25.00',
            'total'      => '50.00',
        ]);
        $this->assertDatabaseHas('products', [
            'id'    => $product->id,
            'stock' => 3,
        ]);
        $this->assertDatabaseHas('payments', [
            'order_id' => $response->json('data.id'),
            'method'   => 'stripe',
            'status'   => 'pending',
        ]);
        $this->assertDatabaseCount('cart_items', 0);

        Event::assertDispatched(OrderPlaced::class);
    }

    public function test_checkout_returns_empty_cart_error(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->withHeader('Idempotency-Key', 'checkout-empty')
            ->postJson('/api/v1/checkout')
            ->assertUnprocessable()
            ->assertJsonPath('error', 'EMPTY_CART');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_returns_insufficient_stock_error(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'stock' => 1,
            'price' => 12.50,
        ]);

        $this->createCartItem($user, $product, 2);

        $this->actingAs($user)
            ->withHeader('Idempotency-Key', 'checkout-stock')
            ->postJson('/api/v1/checkout')
            ->assertUnprocessable()
            ->assertJsonPath('error', 'INSUFFICIENT_STOCK');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('products', [
            'id'    => $product->id,
            'stock' => 1,
        ]);
        $this->assertDatabaseCount('cart_items', 1);
    }

    public function test_checkout_is_idempotent_for_duplicate_key(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'price' => 30.00,
            'stock' => 5,
        ]);

        $this->createCartItem($user, $product, 1);

        $firstResponse = $this->actingAs($user)
            ->withHeader('Idempotency-Key', 'checkout-duplicate')
            ->postJson('/api/v1/checkout');

        $secondResponse = $this->actingAs($user)
            ->withHeader('Idempotency-Key', 'checkout-duplicate')
            ->postJson('/api/v1/checkout');

        $firstResponse->assertCreated();
        $secondResponse->assertCreated()
            ->assertJsonPath('data.id', $firstResponse->json('data.id'));

        $this->assertSame(1, Order::count());
    }
}