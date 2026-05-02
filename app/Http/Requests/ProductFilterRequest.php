<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'sometimes', 'boolean'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'gte:min_price'],
            'sort'      => ['nullable', Rule::in(['price_asc', 'price_desc', 'name_asc', 'created_desc'])],
        ];
    }

    public function messages(): array
    {
        return [
            'max_price.gte' => 'max_price must be greater than or equal to min_price.',
            'sort.in'       => 'sort must be one of: price_asc, price_desc, name_asc, created_desc.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }
    }
}