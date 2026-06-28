<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => 'sometimes|string|min:3|max:200',
            'url'         => 'sometimes|url|max:2048',
            'type'        => 'sometimes|in:course,documentation,tutorial,article',
            'skill_id'    => 'sometimes|string',
            'description' => 'nullable|string|max:1000',
            'is_free'     => 'nullable|boolean',
            'is_active'   => 'nullable|boolean',
        ];
    }

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