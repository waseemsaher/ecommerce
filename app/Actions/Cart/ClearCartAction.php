<?php

namespace App\Actions\Cart;

use App\Exceptions\EmptyCartException;
use App\Models\CartItem;
use App\Services\CartCacheService;

class ClearCartAction
{
    public function __construct(private CartCacheService $cache) {}

    public function execute(int $userId): void
    {
        $deleted = CartItem::where('user_id', $userId)->delete();

        if (! $deleted) {
            throw new EmptyCartException();
        }

        $this->cache->invalidate($userId);
    }
}