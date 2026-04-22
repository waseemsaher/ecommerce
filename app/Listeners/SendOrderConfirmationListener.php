<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendOrderConfirmationListener implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order->loadMissing('user');

        Mail::raw(
            sprintf(
                'Thanks for your order %s. Total: $%s. Current status: %s.',
                $order->order_number,
                number_format((float) $order->total, 2, '.', ''),
                $order->status->value
            ),
            function ($message) use ($order): void {
                $message->to($order->user->email)
                    ->subject(sprintf('Order confirmation %s', $order->order_number));
            }
        );
    }
}