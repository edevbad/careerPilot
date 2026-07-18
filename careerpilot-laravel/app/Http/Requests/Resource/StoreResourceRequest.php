<?php

namespace App\Http\Requests\Resource;

use Illuminate\Foundation\Http\FormRequest;

class StoreResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'skill_id'         => ['required', 'integer', 'exists:skills,id'],
            'title'            => ['required', 'string', 'max:255'],
            'url'              => ['required', 'url', 'max:2048'],
            'resource_type'    => ['required', 'in:video,article,course,documentation'],
            'difficulty_level' => ['required', 'in:Beginner,Intermediate,Advanced'],
            'platform'         => ['nullable', 'string', 'max:100'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:3000'],
            'is_verified'      => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'skill_id.exists'      => 'The selected skill does not exist.',
            'url.url'              => 'Please provide a valid URL.',
            'resource_type.in'     => 'Type must be video, article, course, or documentation.',
            'difficulty_level.in'  => 'Difficulty must be Beginner, Intermediate, or Advanced.',
        ];
    }
}