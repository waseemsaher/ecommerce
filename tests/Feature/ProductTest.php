<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;  // ← add this import
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    private function makeProducts(int $count = 5, array $overrides = []): void
    {
        Product::factory()->count($count)->create($overrides);
    }

    #[Test]
    public function it_lists_products_with_pagination_envelope(): void
    {
        $this->makeProducts(3);

        $response = $this->getJson('/api/v1/products');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data'  => [['id', 'name', 'price', 'stock', 'is_active']],
                'meta'  => ['current_page', 'per_page', 'total', 'last_page'],
                'links' => ['first', 'last', 'prev', 'next'],
            ])
            ->assertJsonFragment(['success' => true]);
    }

    #[Test]
    public function it_filters_by_is_active(): void
    {
        Product::factory()->create(['is_active' => true]);
        Product::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/products?is_active=true');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertTrue($response->json('data.0.is_active'));
    }

    #[Test]
    public function it_filters_by_price_range(): void
    {
        Product::factory()->create(['price' => 10.00]);
        Product::factory()->create(['price' => 50.00]);
        Product::factory()->create(['price' => 200.00]);

        $response = $this->getJson('/api/v1/products?min_price=20&max_price=100');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('50.00', $response->json('data.0.price'));
    }

    #[Test]
    public function it_rejects_invalid_sort_value(): void
    {
        $this->getJson('/api/v1/products?sort=INVALID_COLUMN; DROP TABLE products;--')
            ->assertUnprocessable()
            ->assertJsonPath('errors.sort.0', fn($msg) => str_contains($msg, 'sort'));
    }

    #[Test]
    public function it_accepts_all_whitelisted_sort_values(): void
    {
        $this->makeProducts(2);

        foreach (['price_asc', 'price_desc', 'name_asc', 'created_desc'] as $sort) {
            $this->getJson("/api/v1/products?sort={$sort}")
                ->assertOk();
        }
    }

    #[Test]
    public function it_shows_a_single_product(): void
    {
        $product = Product::factory()->create(['name' => 'Wireless Headphones']);

        $this->getJson("/api/v1/products/{$product->slug}")
            ->assertOk()
            ->assertJsonFragment([
                'success' => true,
                'message' => 'Operation successful',
            ])
            ->assertJsonPath('data.id', $product->id)
            ->assertJsonPath('data.name', 'Wireless Headphones');
    }

    #[Test]
    public function it_returns_404_for_missing_product(): void
    {
        $this->getJson('/api/v1/products/99999')
            ->assertNotFound()
            ->assertJsonFragment([
                'success' => false,
                'message' => 'Product not found.',
            ]);
    }
}