<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class PaymentProcessingException extends Exception
{
    public function __construct(string $message = 'Payment processing failed')
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error'   => 'PAYMENT_PROCESSING_FAILED',
        ], 422);
    }
}