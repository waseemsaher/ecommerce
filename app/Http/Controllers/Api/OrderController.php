<?php

namespace App\Http\Controllers\Api;

use App\Actions\Order\CreateOrderAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function checkout(Request $request, CreateOrderAction $action): JsonResponse
    {
        $order = $action->execute($request->user()->id);

        return response()->json([
            'data' => $order,
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with('items.product')
            ->latest('id')
            ->cursorPaginate(20);

        return response()->json([
            'data' => $orders->items(),
            'meta' => [
                'next_cursor' => $orders->nextCursor()?->encode(),
                'prev_cursor' => $orders->previousCursor()?->encode(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = $request->user()
            ->orders()
            ->with('items.product')
            ->whereKey($id)
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'data' => $order,
        ]);
    }
}