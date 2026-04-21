<?php

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\EmptyCartException;
use App\Exceptions\InsufficientStockException;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\CartCacheService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateOrderAction
{
    public function __construct(private CartCacheService $cache) {}

    public function execute(int $userId): Order
    {
        return DB::transaction(function () use ($userId): Order {
            $cart = Cart::query()
                ->where('user_id', $userId)
                ->with('items')
                ->lockForUpdate()
                ->first();

            if (! $cart || $cart->items->isEmpty()) {
                throw new EmptyCartException();
            }

            $subtotal = 0.0;
            $order = Order::create([
                'user_id'        => $userId,
                'order_number'   => $this->generateOrderNumber(),
                'status'         => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Pending,
                'subtotal'       => 0,
                'tax'            => 0,
                'total'          => 0,
            ]);

            foreach ($cart->items as $cartItem) {
                $product = Product::query()
                    ->whereKey($cartItem->product_id)
                    ->lockForUpdate()
                    ->first();

                if (! $product || $product->stock < $cartItem->quantity) {
                    throw new InsufficientStockException(
                        sprintf('Insufficient stock for %s.', $product?->name ?? 'the selected product')
                    );
                }

                $lineTotal = (float) $product->price * $cartItem->quantity;
                $subtotal += $lineTotal;

                OrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'price'        => $product->price,
                    'quantity'     => $cartItem->quantity,
                    'total'        => number_format($lineTotal, 2, '.', ''),
                ]);

                $product->decrement('stock', $cartItem->quantity);
            }

            $order->update([
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'tax'      => number_format(0, 2, '.', ''),
                'total'    => number_format($subtotal, 2, '.', ''),
            ]);

            $cart->items()->delete();
            $this->cache->invalidate($userId);

            return $order->load('items.product');
        });
    }

    private function generateOrderNumber(): string
    {
        return sprintf('ORD-%s-%s', now()->format('YmdHis'), Str::upper(Str::random(6)));
    }
}