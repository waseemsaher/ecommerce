<?php

namespace App\Actions\Cart;

use App\Exceptions\CartItemNotFoundException;
use App\Models\CartItem;
use App\Services\CartCacheService;

class RemoveCartItemAction
{
    public function __construct(private CartCacheService $cache) {}

    public function execute(int $userId, int $productId): void
    {
        $deleted = CartItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->delete();

        if (! $deleted) {
            throw new CartItemNotFoundException();
        }

        $this->cache->invalidate($userId);
    }
}