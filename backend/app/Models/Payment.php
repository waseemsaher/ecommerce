<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\PaymentStatus;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'method',
        'transaction_id',
        'amount',
        'currency',
        'status',
        'metadata',
        'paid_at',
    ];

    protected $casts = [
        'status'   => PaymentStatus::class,
        'amount'   => 'decimal:2',
        'metadata' => 'array',      // JSON column → auto encode/decode
        'paid_at'  => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}