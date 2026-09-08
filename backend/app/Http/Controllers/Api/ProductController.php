<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\ProductFilterRequest;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * GET /api/v1/products
     * Offset-paginated, filterable product listing.
     */
    public function index(ProductFilterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $paginator = Product::query()
            ->search($validated['search'] ?? null)
            ->active($validated['is_active'] ?? null)
            ->minPrice($validated['min_price'] ?? null)
            ->maxPrice($validated['max_price'] ?? null)
            ->sorted($validated['sort'] ?? null)
            ->paginate(20)
            ->withQueryString(); // preserves filter params in pagination links

        return response()->json([
            'success' => true,
            'data'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last'  => $paginator->url($paginator->lastPage()),
                'prev'  => $paginator->previousPageUrl(),
                'next'  => $paginator->nextPageUrl(),
            ],
        ]);
    }

    /**
     * GET /api/v1/products/{slug}
     * Single product detail; 404 if not found.
     */
    public function show(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->first();

        if (! $product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Operation successful',
            'data'    => $product,
        ]);
    }
}