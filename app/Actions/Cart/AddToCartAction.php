<?php

namespace App\Actions\Cart;

use App\Models\Cart;
use App\Models\CartItem;
use App\Services\CartCacheService;

class AddToCartAction
{
    public function __construct(private CartCacheService $cache) {}

    /**
     * Add a product to the cart, or increment quantity if already present.
     */
    public function execute(int $userId, int $productId, int $quantity = 1): CartItem
    {
        $cart = Cart::firstOrCreate(['user_id' => $userId]);

        $item = CartItem::firstOrNew([
            'user_id'    => $userId,
            'cart_id'    => $cart->id,
            'product_id' => $productId,
        ]);

        $item->quantity = ($item->exists ? $item->quantity : 0) + $quantity;
        $item->save();

        $this->cache->invalidate($userId);

        return $item->load('product');
    }
}