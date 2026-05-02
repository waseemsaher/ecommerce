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

    /**
     * @return array{0: Order, 1: string|null}  [freshOrder, clientSecret]
     */
    public function execute(Order $order, string $idempotencyKey): array
    {
        $order->loadMissing('items.product', 'payment', 'user');

        if ($order->payment) {
            return [$order->fresh(['items.product', 'payment', 'user']), null];
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

        // client_secret is returned to the caller (controller) but never persisted.
        $clientSecret = $result['client_secret'] ?? null;

        return DB::transaction(function () use ($order, $result, $clientSecret): array {
            $order->payment()->create([
                'method'         => 'stripe',
                'transaction_id' => $result['transaction_id'],
                'amount'         => $order->total,
                'currency'       => $result['currency'] ?? 'USD',
                'status'         => PaymentStatus::Pending->value,
                'metadata'       => array_merge($result['metadata'] ?? [], [
                    'gateway_status' => $result['status'],
                ]),
            ]);

            $order->update([
                'status'         => OrderStatus::Processing->value,
                'payment_status' => PaymentStatus::Pending->value,
            ]);

            event(new OrderPlaced($order->fresh(['items.product', 'payment', 'user'])));

            return [$order->fresh(['items.product', 'payment', 'user']), $clientSecret];
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