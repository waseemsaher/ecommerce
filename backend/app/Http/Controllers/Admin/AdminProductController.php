<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        if ($request->filled('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $products = $query->latest()->paginate($request->input('per_page', 15));

        return response()->json($products);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        return response()->json(['data' => $product]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']) . '-' . Str::random(5);
        $data['sku'] = $data['sku'] ?? strtoupper(Str::random(8));

        $product = Product::create($data);

        return response()->json(['data' => $product], 201);
    }

    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->update($request->validated());

        return response()->json(['data' => $product->fresh()]);
    }

    public function toggleActive(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->update(['is_active' => ! $product->is_active]);

        return response()->json(['data' => $product->fresh()]);
    }
}
