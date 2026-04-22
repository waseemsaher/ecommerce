<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use Stripe\StripeClient;

class StripeGateway implements PaymentGatewayInterface
{
    public function __construct(private ?StripeClient $client = null)
    {
        $secret = config('services.stripe.secret');

        if ($this->client === null && $secret) {
            $this->client = new StripeClient($secret);
        }
    }

    public function createIntent(Order $order, string $idempotencyKey): array
    {
        if (app()->environment('testing') || ! $this->client) {
            return [
                'transaction_id' => 'pi_mock_'.$order->id,
                'client_secret'  => 'mock_secret_'.$order->id,
                'status'         => 'requires_confirmation',
                'currency'       => 'USD',
                'amount'         => (int) round(((float) $order->total) * 100),
                'metadata'       => [
                    'order_id' => (string) $order->id,
                    'order_number' => $order->order_number,
                    'mode' => 'mock',
                ],
            ];
        }

        $amount = (int) round(((float) $order->total) * 100);
        $currency = strtolower(config('services.stripe.currency', 'usd'));

        $intent = $this->client->paymentIntents->create(
            [
                'amount' => $amount,
                'currency' => $currency,
                // CardElement + confirmCardPayment works most reliably with explicit card intent.
                'payment_method_types' => ['card'],
                'metadata' => [
                    'order_id' => (string) $order->id,
                    'order_number' => $order->order_number,
                ],
            ],
            [
                'idempotency_key' => $idempotencyKey,
            ]
        );

        return [
            'transaction_id' => $intent->id,
            'client_secret'  => $intent->client_secret,
            'status'         => $intent->status,
            'currency'       => strtoupper($intent->currency),
            'amount'         => $intent->amount,
            'metadata'       => $intent->metadata?->toArray() ?? [],
        ];
    }

    public function retrieveIntent(string $transactionId): array
    {
        if (app()->environment('testing') || ! $this->client) {
            return [
                'transaction_id' => $transactionId,
                'status'         => 'requires_payment_method',
                'currency'       => null,
                'amount'         => null,
                'metadata'       => [],
            ];
        }

        $intent = $this->client->paymentIntents->retrieve($transactionId, []);

        return [
            'transaction_id' => $intent->id,
            'status'         => $intent->status,
            'currency'       => $intent->currency ? strtoupper($intent->currency) : null,
            'amount'         => $intent->amount,
            'metadata'       => $intent->metadata?->toArray() ?? [],
        ];
    }
}