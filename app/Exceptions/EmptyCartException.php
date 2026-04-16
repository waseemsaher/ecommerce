<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class EmptyCartException extends Exception
{
    public function __construct(string $message = 'Cart is empty')
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error'   => 'EMPTY_CART',
        ], 422);
    }
}