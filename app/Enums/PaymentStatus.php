<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending  = 'pending';
    case Paid     = 'paid';
    case Failed   = 'failed';
    case Refunded = 'refunded';

    public function allowedTransitions(): array
    {
        return match($this) {
            self::Pending  => [self::Paid, self::Failed],
            self::Paid     => [self::Refunded],
            self::Failed   => [],   // terminal
            self::Refunded => [],   // terminal
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions());
    }

    public function label(): string
    {
        return match($this) {
            self::Pending  => 'Pending',
            self::Paid     => 'Paid',
            self::Failed   => 'Failed',
            self::Refunded => 'Refunded',
        };
    }
}