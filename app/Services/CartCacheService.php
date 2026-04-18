<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Support\Facades\Cache;

class CartCacheService
{
    private const PREFIX  = 'cart:v1:';
    private const TTL     = 3600;       // 1 hour
    private const LOCK_TTL = 10;        // seconds

    public function key(int $userId): string
    {
        return self::PREFIX . $userId;
    }

    /**
     * Get cart from cache or DB.
     * Uses Cache::lock() to prevent stampede on cold cache.
     */
    public function remember(int $userId): array
    {
        $cacheKey = $this->key($userId);

        // Fast path — already cached
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // Stampede prevention: only one process rebuilds the cache
        $lock = Cache::lock("lock:{$cacheKey}", self::LOCK_TTL);

        return $lock->block(5, function () use ($cacheKey, $userId) {
            // Re-check after acquiring lock (another process may have set it)
            if (Cache::has($cacheKey)) {
                return Cache::get($cacheKey);
            }

            $cart = Cart::firstOrCreate(['user_id' => $userId]);

            $items = $cart->items()
                ->with('product')
                ->get()
                ->toArray();

            Cache::put($cacheKey, $items, self::TTL);

            return $items;
        });
    }

    public function invalidate(int $userId): void
    {
        Cache::forget($this->key($userId));
    }
}