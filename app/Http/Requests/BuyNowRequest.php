<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BuyNowRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity'   => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
