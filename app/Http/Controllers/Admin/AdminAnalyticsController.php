<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    public function summary(): JsonResponse
    {
        $data = Cache::remember('admin:analytics:summary', 300, function () {
            $totalRevenue = Order::where('payment_status', 'paid')->sum('total');
            $todayRevenue = Order::where('payment_status', 'paid')
                ->whereDate('created_at', today())
                ->sum('total');
            $monthRevenue = Order::where('payment_status', 'paid')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total');

            $ordersByStatus = Order::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status');

            $totalOrders = Order::count();
            $totalUsers = User::count();

            $recentOrders = Order::with('user:id,name,email')
                ->latest()
                ->take(10)
                ->get(['id', 'order_number', 'user_id', 'status', 'payment_status', 'total', 'created_at']);

            return [
                'revenue' => [
                    'total' => (float) $totalRevenue,
                    'today' => (float) $todayRevenue,
                    'month' => (float) $monthRevenue,
                ],
                'orders' => [
                    'total' => $totalOrders,
                    'by_status' => $ordersByStatus,
                ],
                'total_users' => $totalUsers,
                'recent_orders' => $recentOrders,
            ];
        });

        return response()->json($data);
    }

    public function topProducts(): JsonResponse
    {
        $data = Cache::remember('admin:analytics:top-products', 300, function () {
            return OrderItem::select(
                'product_id',
                'product_name',
                DB::raw('SUM(quantity) as total_sold'),
                DB::raw('SUM(total) as total_revenue')
            )
                ->groupBy('product_id', 'product_name')
                ->orderByDesc('total_sold')
                ->take(10)
                ->get();
        });

        return response()->json(['data' => $data]);
    }

    public function userGrowth(): JsonResponse
    {
        $data = Cache::remember('admin:analytics:user-growth', 300, function () {
            return User::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as count')
            )
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get();
        });

        return response()->json(['data' => $data]);
    }
}
