<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): JsonResponse|Response
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json([
                'message' => 'Forbidden.',
                'error' => 'ADMIN_REQUIRED',
            ], 403);
        }

        return $next($request);
    }
}
