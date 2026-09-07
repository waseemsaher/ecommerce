<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with('user:id,name,email');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->input('to'));
        }

        $orders = $query->latest()->paginate($request->input('per_page', 15));

        return response()->json($orders);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::with(['user:id,name,email', 'items.product:id,slug,image_path', 'payment'])
            ->findOrFail($id);

        return response()->json(['data' => $order]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $newStatus = OrderStatus::from($request->validated('status'));
        $currentStatus = OrderStatus::from($order->status);

        if (! $currentStatus->canTransitionTo($newStatus)) {
            return response()->json([
                'message' => "Cannot transition from {$order->status} to {$newStatus->value}.",
                'error' => 'INVALID_STATUS_TRANSITION',
            ], 422);
        }

        if ($newStatus === OrderStatus::Cancelled) {
            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->increment('stock', $item->quantity);
                }
            }
        }

        $order->update(['status' => $newStatus->value]);

        return response()->json(['data' => $order->fresh(['user:id,name,email', 'items', 'payment'])]);
    }
}
