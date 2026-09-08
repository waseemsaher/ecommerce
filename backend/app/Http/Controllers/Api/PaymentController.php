<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Webhook;

class PaymentController extends Controller
{
    public function webhook(Request $request): JsonResponse
    {
        $secret = config('services.stripe.webhook_secret');

        if (! $secret) {
            return response()->json([
                'message' => 'Webhook secret is not configured.',
            ], 422);
        }

        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature'),
                $secret
            );
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Invalid Stripe webhook signature.',
            ], 422);
        }

        $payload = $event->data->object;
        $transactionId = $payload->payment_intent ?? $payload->id ?? null;

        if (! $transactionId) {
            return response()->json(['message' => 'Ignored.']);
        }

        $order = Order::query()
            ->whereHas('payment', fn ($query) => $query->where('transaction_id', $transactionId))
            ->with('payment', 'items.product')
            ->first();

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if ($event->type === 'payment_intent.succeeded') {
            $order->payment()->update([
                'status' => PaymentStatus::Paid->value,
                'paid_at' => now(),
            ]);

            $order->update([
                'status' => OrderStatus::Completed->value,
                'payment_status' => PaymentStatus::Paid->value,
            ]);
        }

        if (in_array($event->type, ['charge.refunded', 'refund.updated', 'payment_intent.canceled'], true)) {
            foreach ($order->items as $item) {
                $item->product()->increment('stock', $item->quantity);
            }

            $order->payment()->update([
                'status' => PaymentStatus::Refunded->value,
            ]);

            $order->update([
                'status' => OrderStatus::Refunded->value,
                'payment_status' => PaymentStatus::Refunded->value,
            ]);
        }

        if ($event->type === 'payment_intent.payment_failed') {
            foreach ($order->items as $item) {
                $item->product()->increment('stock', $item->quantity);
            }

            $order->payment()->update([
                'status' => PaymentStatus::Failed->value,
            ]);

            $order->update([
                'status' => OrderStatus::Cancelled->value,
                'payment_status' => PaymentStatus::Failed->value,
            ]);
        }

        return response()->json(['message' => 'Webhook processed.']);
    }
}