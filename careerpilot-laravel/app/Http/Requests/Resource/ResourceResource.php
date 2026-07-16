<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API transformer for a Resource model.
 * Shapes the payload consistently for all endpoints.
 */
class ResourceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'skillId'            => $this->skill_id,
            'skill'              => $this->whenLoaded('skill', fn() => [
                'id'       => $this->skill->id,
                'name'     => $this->skill->name,
                'category' => $this->skill->category,
            ]),
            'title'              => $this->title,
            'url'                => $this->url,
            'resourceType'       => $this->resource_type,
            'difficultyLevel'    => $this->difficulty_level,
            'platform'           => $this->platform,
            'durationMinutes'    => $this->duration_minutes,
            'durationFormatted'  => $this->duration_formatted,  // Accessor from model
            'rating'             => round($this->rating, 2),
            'ratingCount'        => $this->rating_count,
            'isVerified'         => $this->is_verified,
            'isDeprecated'       => $this->is_deprecated,
            'relevanceScore'     => $this->relevance_score,
            // Only shown to admins
            'createdAt'          => $this->when(
                $request->user()?->role === 'admin',
                $this->created_at?->toISOString()
            ),
            'updatedAt'          => $this->when(
                $request->user()?->role === 'admin',
                $this->updated_at?->toISOString()
            ),
        ];
    }
}