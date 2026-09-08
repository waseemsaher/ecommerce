<?php

namespace App\Contracts;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * @return array{
     *     transaction_id: string,
     *     client_secret: string|null,
     *     status: string,
     *     currency: string,
     *     amount: int,
     *     metadata: array<string, mixed>
     * }
     */
    public function createIntent(Order $order, string $idempotencyKey): array;

    /**
     * @return array{
     *     transaction_id: string,
     *     status: string,
     *     currency: string|null,
     *     amount: int|null,
     *     metadata: array<string, mixed>
     * }
     */
    public function retrieveIntent(string $transactionId): array;
}