<?php

namespace App\Actions\Cart;

use App\Exceptions\EmptyCartException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Services\CartCacheService;

class ClearCartAction
{
    public function __construct(private CartCacheService $cache) {}

    public function execute(int $userId): void
    {
        $cart = Cart::where('user_id', $userId)->first();

        if (! $cart) {
            throw new EmptyCartException();
        }

        $deleted = CartItem::where('cart_id', $cart->id)->delete();

        if (! $deleted) {
            throw new EmptyCartException();
        }

        $this->cache->invalidate($userId);
    }
}