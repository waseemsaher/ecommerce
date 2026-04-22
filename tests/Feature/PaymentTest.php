<?php

namespace Tests\Feature;

use App\Actions\Order\CreateOrderAction;
use App\Actions\Payment\ProcessPaymentAction;
use App\Contracts\PaymentGatewayInterface;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Stripe\Webhook;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function bindGateway(array $result = [], ?\Throwable $throwable = null): void
    {
        $this->app->bind(PaymentGatewayInterface::class, function () use ($result, $throwable) {
            return new class($result, $throwable) implements PaymentGatewayInterface {
                public function __construct(private array $result, private ?\Throwable $throwable) {}

                public function createIntent(Order $order, string $idempotencyKey): array
                {
                    if ($this->throwable) {
                        throw $this->throwable;
                    }

                    return array_merge([
                        'transaction_id' => 'pi_test_'.$order->id,
                        'client_secret'  => 'secret_'.$order->id,
                        'status'         => 'requires_confirmation',
                        'currency'       => 'USD',
                        'amount'         => (int) round(((float) $order->total) * 100),
                        'metadata'       => [],
                    ], $this->result);
                }

                public function retrieveIntent(string $transactionId): array
                {
                    return [
                        'transaction_id' => $transactionId,
                        'status' => 'succeeded',
                        'currency' => 'USD',
                        'amount' => null,
                        'metadata' => [],
                    ];
                }
            };
        });
    }

    private function createOrder(User $user, Product $product, int $quantity = 1): Order
    {
        CartItem::factory()->forUser($user)->create([
            'product_id' => $product->id,
            'quantity'   => $quantity,
        ]);

        $this->bindGateway();

        return app(CreateOrderAction::class)
            ->execute($user->id)
            ->fresh(['items.product', 'payment', 'user']);
    }

    private function stripeSignature(string $payload, string $secret, ?int $timestamp = null): string
    {
        $timestamp ??= time();
        $signedPayload = $timestamp.'.'.$payload;
        $signature = hash_hmac('sha256', $signedPayload, $secret);

        return sprintf('t=%d,v1=%s', $timestamp, $signature);
    }

    public function test_checkout_creates_pending_payment_and_processing_order(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 19.99, 'stock' => 4]);

        CartItem::factory()->forUser($user)->create([
            'product_id' => $product->id,
            'quantity'   => 2,
        ]);

        $response = $this->actingAs($user)
            ->withHeader('Idempotency-Key', 'pay-1')
            ->postJson('/api/v1/checkout');

        $response->assertCreated()
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.payment_status', 'pending');

        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'status' => 'processing',
            'payment_status' => 'pending',
        ]);
    }

    public function test_gateway_failure_cancels_order_and_restocks(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 15.00, 'stock' => 3]);

        CartItem::factory()->forUser($user)->create([
            'product_id' => $product->id,
            'quantity'   => 2,
        ]);

        $this->bindGateway([], new \RuntimeException('Gateway unavailable'));

        $order = app(CreateOrderAction::class)->execute($user->id);

        try {
            app(ProcessPaymentAction::class)->execute($order, 'pay-failure');
            $this->fail('Expected payment processing to fail.');
        } catch (\Throwable) {
            $this->assertDatabaseHas('orders', [
                'id' => $order->id,
                'status' => 'cancelled',
                'payment_status' => 'failed',
            ]);

            $this->assertDatabaseHas('products', [
                'id' => $product->id,
                'stock' => 3,
            ]);

            $this->assertDatabaseHas('cart_items', [
                'product_id' => $product->id,
                'quantity'   => 2,
            ]);
        }
    }

    public function test_webhook_marks_payment_complete_when_signature_is_valid(): void
    {
        config(['services.stripe.webhook_secret' => 'whsec_test_secret']);

        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 12.00, 'stock' => 5]);

        $order = $this->createOrder($user, $product, 1);
        $order = app(ProcessPaymentAction::class)->execute($order, 'pay-webhook');

        $order->payment()->update(['transaction_id' => 'pi_valid_123']);

        $payload = json_encode([
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_valid_123',
                ],
            ],
        ]);

        $signature = $this->stripeSignature($payload, 'whsec_test_secret');

        $this->postJson('/api/v1/payments/webhook', json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ])->assertOk();

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => OrderStatus::Completed->value,
            'payment_status' => PaymentStatus::Paid->value,
        ]);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'transaction_id' => 'pi_valid_123',
            'status' => PaymentStatus::Paid->value,
        ]);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        config(['services.stripe.webhook_secret' => 'whsec_test_secret']);

        $this->postJson('/api/v1/payments/webhook', [
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => ['id' => 'pi_invalid']],
        ], [
            'Stripe-Signature' => 't=1,v1=bad-signature',
        ])->assertUnprocessable();
    }
}