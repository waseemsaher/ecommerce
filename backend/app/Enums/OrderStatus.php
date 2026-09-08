<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending    = 'pending';
    case Processing = 'processing';
    case Completed  = 'completed';
    case Cancelled  = 'cancelled';
    case Refunded   = 'refunded';

    /**
     * Returns allowed next statuses from the current one.
     * Enforces the state machine transition rules.
     */
    public function allowedTransitions(): array
    {
        return match($this) {
            self::Pending    => [self::Processing, self::Cancelled],
            self::Processing => [self::Completed, self::Cancelled, self::Refunded],
            self::Completed  => [self::Refunded],
            self::Cancelled  => [],   // terminal
            self::Refunded   => [],   // terminal
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions());
    }

    /** Human-readable label for UI display */
    public function label(): string
    {
        return match($this) {
            self::Pending    => 'Pending',
            self::Processing => 'Processing',
            self::Completed  => 'Completed',
            self::Cancelled  => 'Cancelled',
            self::Refunded   => 'Refunded',
        };
    }
}