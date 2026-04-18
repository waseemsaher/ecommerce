<?php

namespace Tests\Feature;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class CartTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user    = User::factory()->create();
        $this->product = Product::factory()->create(['stock' => 10]);
    }

    private function cartId(): int
    {
        return Cart::firstOrCreate(['user_id' => $this->user->id])->id;
    }

    // ── GET /cart ─────────────────────────────────────────────────────────────

    public function test_get_cart_returns_empty_for_new_user(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/cart')
            ->assertOk()
            ->assertJson(['data' => []]);
    }

    public function test_get_cart_eager_loads_product(): void
    {
        CartItem::factory()->forUser($this->user)->create([
            'product_id' => $this->product->id,
            'quantity'   => 2,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/cart')
            ->assertOk();

        $response->assertJsonPath('data.0.product.id', $this->product->id);
    }

    // ── POST /cart/items ───────────────────────────────────────────────────────

    public function test_add_item_to_cart(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/cart/items', [
                'product_id' => $this->product->id,
                'quantity'   => 2,
            ])
            ->assertCreated()
            ->assertJsonPath('data.quantity', 2);

        $this->assertDatabaseHas('cart_items', [
            'cart_id'    => $this->cartId(),
            'product_id' => $this->product->id,
            'quantity'   => 2,
        ]);
    }

    public function test_adding_existing_item_increments_quantity(): void
    {
        CartItem::factory()->forUser($this->user)->create([
            'product_id' => $this->product->id,
            'quantity'   => 3,
        ]);

        $this->actingAs($this->user)
            ->postJson('/api/cart/items', [
                'product_id' => $this->product->id,
                'quantity'   => 2,
            ])
            ->assertCreated()
            ->assertJsonPath('data.quantity', 5);
    }

    // ── PUT /cart/items/{productId} ────────────────────────────────────────────

    public function test_update_cart_item_quantity(): void
    {
        CartItem::factory()->forUser($this->user)->create([
            'product_id' => $this->product->id,
            'quantity'   => 1,
        ]);

        $this->actingAs($this->user)
            ->putJson("/api/cart/items/{$this->product->id}", ['quantity' => 5])
            ->assertOk()
            ->assertJsonPath('data.quantity', 5);
    }

    public function test_update_returns_404_for_missing_item(): void
    {
        $this->actingAs($this->user)
            ->putJson("/api/cart/items/{$this->product->id}", ['quantity' => 5])
            ->assertNotFound()
            ->assertJsonPath('error', 'CART_ITEM_NOT_FOUND');
    }

    // ── DELETE /cart/items/{productId} ────────────────────────────────────────
    #[Test]
    public function test_remove_cart_item(): void
    {
        CartItem::factory()->forUser($this->user)->create([
            'product_id' => $this->product->id,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/cart/items/{$this->product->id}")
            ->assertOk()
            ->assertJson(['message' => 'Item removed']);

        $this->assertDatabaseMissing('cart_items', [
            'cart_id'    => $this->cartId(),
            'product_id' => $this->product->id,
        ]);
    }

    public function test_remove_returns_404_for_missing_item(): void
    {
        $this->actingAs($this->user)
            ->deleteJson("/api/cart/items/9999")
            ->assertNotFound()
            ->assertJsonPath('error', 'CART_ITEM_NOT_FOUND');
    }

    // ── DELETE /cart ───────────────────────────────────────────────────────────

    public function test_clear_cart(): void
    {
        CartItem::factory()->count(3)->forUser($this->user)->create();

        $this->actingAs($this->user)
            ->deleteJson('/api/cart')
            ->assertOk()
            ->assertJson(['message' => 'Cart cleared']);

        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_clear_empty_cart_returns_422(): void
    {
        $this->actingAs($this->user)
            ->deleteJson('/api/cart')
            ->assertUnprocessable()
            ->assertJsonPath('error', 'EMPTY_CART');
    }

    // ── Cache invalidation ─────────────────────────────────────────────────────

    public function test_cache_is_invalidated_on_add(): void
    {
        $cacheKey = "cart:v1:{$this->user->id}";
        Cache::put($cacheKey, ['stale' => 'data'], 3600);

        $this->actingAs($this->user)
            ->postJson('/api/cart/items', [
                'product_id' => $this->product->id,
                'quantity'   => 1,
            ])
            ->assertCreated();

        $this->assertFalse(Cache::has($cacheKey));
    }

    public function test_cache_is_invalidated_on_remove(): void
    {
        $cacheKey = "cart:v1:{$this->user->id}";
        Cache::put($cacheKey, ['stale' => 'data'], 3600);

        CartItem::factory()->forUser($this->user)->create([
            'product_id' => $this->product->id,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/cart/items/{$this->product->id}")
            ->assertOk();

        $this->assertFalse(Cache::has($cacheKey));
    }

    public function test_cache_is_invalidated_on_clear(): void
    {
        $cacheKey = "cart:v1:{$this->user->id}";
        Cache::put($cacheKey, ['stale' => 'data'], 3600);

        CartItem::factory()->count(2)->forUser($this->user)->create();

        $this->actingAs($this->user)->deleteJson('/api/cart')->assertOk();

        $this->assertFalse(Cache::has($cacheKey));
    }

    // ── Auth guard ─────────────────────────────────────────────────────────────

    public function test_cart_routes_require_authentication(): void
    {
        $this->getJson('/api/cart')->assertUnauthorized();
        $this->postJson('/api/cart/items')->assertUnauthorized();
        $this->putJson('/api/cart/items/1')->assertUnauthorized();
        $this->deleteJson('/api/cart/items/1')->assertUnauthorized();
        $this->deleteJson('/api/cart')->assertUnauthorized();
    }
}