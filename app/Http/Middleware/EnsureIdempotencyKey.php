<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class EnsureIdempotencyKey
{
    public function handle(Request $request, Closure $next): JsonResponse|Response
    {
        $idempotencyKey = $request->header('Idempotency-Key');

        if (! $idempotencyKey) {
            return response()->json([
                'message' => 'Idempotency-Key header is required.',
                'error'   => 'IDEMPOTENCY_KEY_REQUIRED',
            ], 422);
        }

        $cacheKey = $this->cacheKey($request, $idempotencyKey);

        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);

            return response()->json(
                $cachedResponse['data'],
                $cachedResponse['status']
            );
        }

        $response = $next($request);

        if ($response instanceof JsonResponse && $response->isSuccessful()) {
            Cache::put($cacheKey, [
                'status' => $response->status(),
                'data'   => $response->getData(true),
            ], now()->addDay());
        }

        return $response;
    }

    private function cacheKey(Request $request, string $idempotencyKey): string
    {
        return sprintf(
            'idempotency:checkout:%s:%s',
            $request->user()?->id ?? $request->ip(),
            hash('sha256', $idempotencyKey)
        );
    }
}