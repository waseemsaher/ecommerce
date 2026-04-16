<?php

namespace App\Http\Controllers;

use App\Actions\Cart\AddToCartAction;
use App\Actions\Cart\ClearCartAction;
use App\Actions\Cart\RemoveCartItemAction;
use App\Actions\Cart\UpdateCartItemAction;
use App\Http\Requests\AddToCartRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Services\CartCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartCacheService $cache) {}

    // GET /cart — eager-loads items.product via cache service
    public function index(Request $request): JsonResponse
    {
        $items = $this->cache->remember($request->user()->id);

        return response()->json(['data' => $items]);
    }

    // POST /cart/items
    public function store(AddToCartRequest $request, AddToCartAction $action): JsonResponse
    {
        $item = $action->execute(
            $request->user()->id,
            $request->validated('product_id'),
            $request->validated('quantity', 1),
        );

        return response()->json(['data' => $item], 201);
    }

    // PUT /cart/items/{productId}
    public function update(
        UpdateCartItemRequest $request,
        int $productId,
        UpdateCartItemAction $action,
    ): JsonResponse {
        $item = $action->execute(
            $request->user()->id,
            $productId,
            $request->validated('quantity'),
        );

        return response()->json(['data' => $item]);
    }

    // DELETE /cart/items/{productId}
    public function destroy(Request $request, int $productId, RemoveCartItemAction $action): JsonResponse
    {
        $action->execute($request->user()->id, $productId);

        return response()->json(['message' => 'Item removed']);
    }

    // DELETE /cart
    public function clear(Request $request, ClearCartAction $action): JsonResponse
    {
        $action->execute($request->user()->id);

        return response()->json(['message' => 'Cart cleared']);
    }
}