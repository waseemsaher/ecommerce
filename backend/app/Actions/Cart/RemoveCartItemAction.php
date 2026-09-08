<?php

namespace App\Actions\Cart;

use App\Exceptions\CartItemNotFoundException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Services\CartCacheService;

class RemoveCartItemAction
{
    public function __construct(private CartCacheService $cache) {}

    public function execute(int $userId, int $productId): void
    {
        $cart = Cart::where('user_id', $userId)->first();

        if (! $cart) {
            throw new CartItemNotFoundException();
        }

        $deleted = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->delete();

        if (! $deleted) {
            throw new CartItemNotFoundException();
        }

        $this->cache->invalidate($userId);
    }
}