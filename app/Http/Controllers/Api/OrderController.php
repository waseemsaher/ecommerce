<?php

namespace App\Http\Controllers\Api;

use App\Actions\Order\CreateOrderFromProductAction;
use App\Actions\Order\CreateOrderAction;
use App\Actions\Payment\ProcessPaymentAction;
use App\Contracts\PaymentGatewayInterface;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\BuyNowRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function buyNow(
        BuyNowRequest $request,
        CreateOrderFromProductAction $createOrderFromProductAction,
        ProcessPaymentAction $processPaymentAction,
    ): JsonResponse {
        $order = $createOrderFromProductAction->execute(
            $request->user()->id,
            (int) $request->validated('product_id'),
            (int) $request->validated('quantity', 1),
        );

        [$order, $clientSecret] = $processPaymentAction->execute($order, (string) $request->header('Idempotency-Key'));

        $data = $order->toArray();
        $data['client_secret'] = $clientSecret;

        return response()->json(['data' => $data], 201);
    }

    public function checkout(
        Request $request,
        CreateOrderAction $createOrderAction,
        ProcessPaymentAction $processPaymentAction,
    ): JsonResponse {
        $order = $createOrderAction->execute($request->user()->id);

        [$order, $clientSecret] = $processPaymentAction->execute($order, (string) $request->header('Idempotency-Key'));

        $data = $order->toArray();
        $data['client_secret'] = $clientSecret;

        return response()->json(['data' => $data], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with('items.product', 'payment')
            ->latest('id')
            ->cursorPaginate(20);

        // Do NOT call Stripe on every order in the list — that causes N+1 API calls.
        // Stripe status reconciliation happens only on the single-order detail endpoint.
        return response()->json([
            'data' => $orders->items(),
            'meta' => [
                'next_cursor' => $orders->nextCursor()?->encode(),
                'prev_cursor' => $orders->previousCursor()?->encode(),
            ],
        ]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = $request->user()
            ->orders()
            ->with('items.product', 'payment')
            ->whereKey($id)
            ->first();

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if (! $order->status->canTransitionTo(OrderStatus::Cancelled)) {
            return response()->json([
                'message' => 'This order cannot be cancelled in its current state.',
            ], 422);
        }

        // Restore stock
        foreach ($order->items as $item) {
            $item->product()->increment('stock', $item->quantity);
        }

        $order->update([
            'status'         => OrderStatus::Cancelled->value,
            'payment_status' => PaymentStatus::Failed->value,
        ]);

        return response()->json([
            'data'    => $order->fresh(['items.product', 'payment']),
            'message' => 'Order cancelled successfully.',
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = $request->user()
            ->orders()
            ->with('items.product', 'payment')
            ->whereKey($id)
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        $order = $this->reconcileOrderStatus($order, app(PaymentGatewayInterface::class));

        return response()->json([
            'data' => $order,
        ]);
    }

    private function reconcileOrderStatus(Order $order, PaymentGatewayInterface $gateway): Order
    {
        if (app()->environment('testing')) {
            return $order->fresh(['items.product', 'payment']);
        }

        $order->loadMissing('payment', 'items.product');

        if (! $order->payment || ! in_array($order->status, [OrderStatus::Pending, OrderStatus::Processing], true)) {
            return $order->fresh(['items.product', 'payment']);
        }

        $payment = $order->payment;

        if (! $payment->transaction_id) {
            return $order->fresh(['items.product', 'payment']);
        }

        $intent = $gateway->retrieveIntent($payment->transaction_id);
        $intentStatus = $intent['status'] ?? null;

        if ($intentStatus === 'succeeded') {
            $payment->update([
                'status'   => PaymentStatus::Paid->value,
                'paid_at'  => $payment->paid_at ?? now(),
                'metadata' => array_merge($payment->metadata ?? [], [
                    'gateway_status' => $intentStatus,
                ]),
            ]);

            $order->update([
                'status'         => OrderStatus::Completed->value,
                'payment_status' => PaymentStatus::Paid->value,
            ]);
        }

        if (in_array($intentStatus, ['requires_action', 'processing', 'requires_confirmation', 'requires_payment_method'], true)) {
            $payment->update([
                'status'   => PaymentStatus::Pending->value,
                'metadata' => array_merge($payment->metadata ?? [], [
                    'gateway_status' => $intentStatus,
                ]),
            ]);

            $order->update([
                'status'         => OrderStatus::Processing->value,
                'payment_status' => PaymentStatus::Pending->value,
            ]);
        }

        if ($intentStatus === 'canceled') {
            $payment->update([
                'status'   => PaymentStatus::Failed->value,
                'metadata' => array_merge($payment->metadata ?? [], [
                    'gateway_status' => $intentStatus,
                ]),
            ]);

            $order->update([
                'status'         => OrderStatus::Cancelled->value,
                'payment_status' => PaymentStatus::Failed->value,
            ]);
        }

        return $order->fresh(['items.product', 'payment']);
    }
}