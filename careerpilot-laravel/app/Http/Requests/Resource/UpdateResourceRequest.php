<?php

namespace App\Http\Requests\Resource;

use Illuminate\Foundation\Http\FormRequest;

class UpdateResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'skill_id'         => ['sometimes', 'integer', 'exists:skills,id'],
            'title'            => ['sometimes', 'string', 'max:255'],
            'url'              => ['sometimes', 'url', 'max:2048'],
            'resource_type'    => ['sometimes', 'in:video,article,course,documentation'],
            'difficulty_level' => ['sometimes', 'in:Beginner,Intermediate,Advanced'],
            'platform'         => ['sometimes', 'nullable', 'string', 'max:100'],
            'duration_minutes' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:3000'],
            'is_verified'      => ['sometimes', 'boolean'],
            'is_deprecated'    => ['sometimes', 'boolean'],
        ];
    }
}