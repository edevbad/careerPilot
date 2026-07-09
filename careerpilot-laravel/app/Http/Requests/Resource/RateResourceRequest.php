<?php

namespace App\Http\Requests\Resource;

use Illuminate\Foundation\Http\FormRequest;

class RateResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Any authenticated user can rate
    }

    public function rules(): array
    {
        return [
            'rating' => ['required', 'numeric', 'min:1', 'max:5'],
        ];
    }

    public function messages(): array
    {
        return [
            'rating.min' => 'Rating must be between 1 and 5.',
            'rating.max' => 'Rating must be between 1 and 5.',
        ];
    }
}