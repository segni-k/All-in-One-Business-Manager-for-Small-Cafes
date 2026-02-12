<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled in controller middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
     public function rules(): array
    {
        return [
            'name'        => 'sometimes|string|max:255',
            'sku'         => 'sometimes|nullable|string|max:100|unique:products,sku,' . $this->product->id,
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'image_url'   => 'sometimes|nullable|url|max:2048',
            'price'       => 'sometimes|numeric|min:0',
            'cost'        => 'sometimes|numeric|min:0',
            'stock'       => 'sometimes|integer|min:0',
            'is_active'   => 'sometimes|boolean',
        ];
    }
}
