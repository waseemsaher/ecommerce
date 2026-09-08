<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $recentOrders = $user->orders()
            ->latest()
            ->take(5)
            ->get(['id', 'order_number', 'status', 'payment_status', 'total', 'created_at']);

        $totalSpent = $user->orders()
            ->where('payment_status', 'paid')
            ->sum('total');

        $orderCount = $user->orders()->count();

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'member_since' => $user->created_at->toDateString(),
            ],
            'stats' => [
                'total_spent' => (float) $totalSpent,
                'order_count' => $orderCount,
            ],
            'recent_orders' => $recentOrders,
        ]);
    }
}
