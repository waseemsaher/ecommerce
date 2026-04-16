<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;  // ← add this
use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    use HasFactory;  // ← add this

    protected $fillable = ['user_id', 'cart_id', 'product_id', 'quantity'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}