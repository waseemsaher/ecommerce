<?php

namespace App\Actions\Cart;

use App\Exceptions\CartItemNotFoundException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Services\CartCacheService;

class UpdateCartItemAction
{
    public function __construct(private CartCacheService $cache) {}

    public function execute(int $userId, int $productId, int $quantity): CartItem
    {
        $cart = Cart::where('user_id', $userId)->first();

        if (! $cart) {
            throw new CartItemNotFoundException();
        }

        $item = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->first();

        if (! $item) {
            throw new CartItemNotFoundException();
        }

        $item->update(['quantity' => $quantity]);

        $this->cache->invalidate($userId);

        return $item->load('product');
    }
}