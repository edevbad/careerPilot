<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => 'required|string|min:3|max:200',
            'url'         => 'required|url|max:2048',
            'type'        => 'required|in:course,documentation,tutorial,article',
            'skill_id'    => 'required|string',
            'description' => 'nullable|string|max:1000',
            'is_free'     => 'nullable|boolean',
            'is_active'   => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'    => 'Resource title is required.',
            'url.required'      => 'Resource URL is required.',
            'url.url'           => 'Must be a valid URL.',
            'type.required'     => 'Resource type is required.',
            'type.in'           => 'Type must be: course, documentation, tutorial, or article.',
            'skill_id.required' => 'skill_id is required.',
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