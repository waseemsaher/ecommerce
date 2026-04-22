<?php

namespace App\Actions\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\OrderPlaced;
use App\Exceptions\PaymentProcessingException;
use App\Models\Cart;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class ProcessPaymentAction
{
    public function __construct(private PaymentGatewayInterface $gateway) {}

    public function execute(Order $order, string $idempotencyKey): Order
    {
        $order->loadMissing('items.product', 'payment', 'user');

        if ($order->payment) {
            return $order->fresh(['items.product', 'payment', 'user']);
        }

        try {
            $result = $this->gateway->createIntent($order, $idempotencyKey);
        } catch (\Throwable $throwable) {
            $this->restoreStock($order);
            $this->restoreCart($order);

            $order->update([
                'status'         => OrderStatus::Cancelled->value,
                'payment_status' => PaymentStatus::Failed->value,
            ]);

            throw new PaymentProcessingException($throwable->getMessage());
        }

        return DB::transaction(function () use ($order, $result): Order {
            $order->payment()->create([
                'method'         => 'stripe',
                'transaction_id' => $result['transaction_id'],
                'amount'         => $order->total,
                'currency'       => $result['currency'] ?? 'USD',
                'status'         => PaymentStatus::Pending->value,
                'metadata'       => array_merge($result['metadata'] ?? [], [
                    'client_secret'  => $result['client_secret'],
                    'gateway_status' => $result['status'],
                ]),
            ]);

            $order->update([
                'status'         => OrderStatus::Processing->value,
                'payment_status' => PaymentStatus::Pending->value,
            ]);

            event(new OrderPlaced($order->fresh(['items.product', 'payment', 'user'])));

            return $order->fresh(['items.product', 'payment', 'user']);
        });
    }

    private function restoreStock(Order $order): void
    {
        foreach ($order->items as $item) {
            $item->product()->increment('stock', $item->quantity);
        }
    }

    private function restoreCart(Order $order): void
    {
        $cart = Cart::firstOrCreate(['user_id' => $order->user_id]);

        foreach ($order->items as $item) {
            $cartItem = $cart->items()
                ->where('product_id', $item->product_id)
                ->first();

            if ($cartItem) {
                $cartItem->increment('quantity', $item->quantity);
                continue;
            }

            $cart->items()->create([
                'product_id' => $item->product_id,
                'quantity'   => $item->quantity,
            ]);
        }

        app(\App\Services\CartCacheService::class)->invalidate($order->user_id);
    }
}