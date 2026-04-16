<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class CartItemNotFoundException extends Exception
{
    public function __construct(string $message = 'Cart item not found')
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error'   => 'CART_ITEM_NOT_FOUND',
        ], 404);
    }
}