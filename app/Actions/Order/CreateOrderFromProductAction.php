<?php

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\InsufficientStockException;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateOrderFromProductAction
{
    public function execute(int $userId, int $productId, int $quantity = 1): Order
    {
        return DB::transaction(function () use ($userId, $productId, $quantity): Order {
            $product = Product::query()
                ->whereKey($productId)
                ->lockForUpdate()
                ->first();

            if (! $product || $product->stock < $quantity) {
                throw new InsufficientStockException(
                    sprintf('Insufficient stock for %s.', $product?->name ?? 'the selected product')
                );
            }

            $lineTotal = (float) $product->price * $quantity;
            $tax       = $lineTotal * 0.10;
            $total     = $lineTotal + $tax;

            $order = Order::create([
                'user_id'        => $userId,
                'order_number'   => $this->generateOrderNumber(),
                'status'         => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Pending,
                'subtotal'       => number_format($lineTotal, 2, '.', ''),
                'tax'            => number_format($tax, 2, '.', ''),
                'total'          => number_format($total, 2, '.', ''),
            ]);

            OrderItem::create([
                'order_id'     => $order->id,
                'product_id'   => $product->id,
                'product_name' => $product->name,
                'price'        => $product->price,
                'quantity'     => $quantity,
                'total'        => number_format($lineTotal, 2, '.', ''),
            ]);

            $product->decrement('stock', $quantity);

            return $order->load('items.product');
        });
    }

    private function generateOrderNumber(): string
    {
        return sprintf('ORD-%s-%s', now()->format('YmdHis'), Str::upper(Str::random(6)));
    }
}
