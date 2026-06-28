<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreSkillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|min:2|max:100',
            'category'    => 'required|string|min:2|max:100',
            'description' => 'nullable|string|max:500',
            'is_active'   => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'Skill name is required.',
            'name.min'          => 'Skill name must be at least 2 characters.',
            'category.required' => 'Category is required.',
        ];
    }

    // Return JSON validation errors instead of redirect
    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors'  => collect($validator->errors())->map(fn($msgs, $field) => [
                'field'   => $field,
                'message' => $msgs[0],
            ])->values(),
        ], 422));
    }
}