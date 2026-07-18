<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\Skill;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ResourceService
{
    // ── Public: filtered listing ───────────────────────────────

    /**
     * Return a paginated, filtered list of resources.
     * Used by both the public browse endpoint and admin listing.
     *
     * Filters: skill_id, resource_type, difficulty_level,
     *          is_verified, search (title LIKE), include_deprecated (admin only)
     */
    public function list(array $filters, bool $isAdmin = false): LengthAwarePaginator
    {
        $query = Resource::with('skill');

        // Non-admins never see deprecated resources
        if (!$isAdmin || empty($filters['include_deprecated'])) {
            $query->active();
        }

        if (!empty($filters['skill_id'])) {
            $query->where('skill_id', $filters['skill_id']);
        }

        if (!empty($filters['resource_type'])) {
            $query->ofType($filters['resource_type']);
        }

        if (!empty($filters['difficulty_level'])) {
            $query->ofLevel($filters['difficulty_level']);
        }

        if (isset($filters['is_verified']) && $filters['is_verified'] !== '') {
            $query->where('is_verified', (bool) $filters['is_verified']);
        }

        if (!empty($filters['search'])) {
            $query->where('title', 'like', '%' . $filters['search'] . '%');
        }

        // Default sort: relevance_score DESC, then rating DESC
        $sortBy  = in_array($filters['sort_by'] ?? '', ['rating', 'created_at', 'title'])
            ? $filters['sort_by']
            : 'relevance_score';
        $sortDir = ($filters['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($filters['per_page'] ?? 15);
    }

    // ── Public: single resource ────────────────────────────────

    public function findOrFail(int $id): Resource
    {
        return Resource::with('skill')->findOrFail($id);
    }

    // ── Admin: create ──────────────────────────────────────────

    public function create(array $data): Resource
    {
        $resource = Resource::create($data);

        // Compute initial relevance score
        $levelScore = $this->levelScore($resource->difficulty_level, $resource->skill->difficulty_level ?? 'Beginner');
        $resource->recalculateRelevanceScore($levelScore);

        return $resource->load('skill');
    }

    // ── Admin: update ──────────────────────────────────────────

    public function update(Resource $resource, array $data): Resource
    {
        $resource->update($data);

        // Re-score whenever difficulty or rating-adjacent fields change
        if (array_key_exists('difficulty_level', $data) || array_key_exists('skill_id', $data)) {
            $resource->refresh()->load('skill');
            $levelScore = $this->levelScore(
                $resource->difficulty_level,
                $resource->skill->difficulty_level ?? 'Beginner'
            );
            $resource->recalculateRelevanceScore($levelScore);
        }

        return $resource->load('skill');
    }

    // ── Admin: delete (soft) ───────────────────────────────────

    public function delete(Resource $resource): void
    {
        $resource->delete();
    }

    // ── Admin: toggle deprecated ───────────────────────────────

    public function toggleDeprecated(Resource $resource): Resource
    {
        $resource->update(['is_deprecated' => !$resource->is_deprecated]);
        return $resource;
    }

    // ── Admin: toggle verified ─────────────────────────────────

    public function toggleVerified(Resource $resource): Resource
    {
        $resource->update(['is_verified' => !$resource->is_verified]);

        // Re-score: verified resources get a minor trust boost
        // We treat is_verified as a 0.1 bump on the level score
        $resource->refresh()->load('skill');
        $levelScore = $this->levelScore(
            $resource->difficulty_level,
            $resource->skill->difficulty_level ?? 'Beginner'
        );
        $resource->recalculateRelevanceScore($levelScore + ($resource->is_verified ? 0.1 : 0.0));

        return $resource;
    }

    // ── Public: rate a resource ────────────────────────────────

    public function rate(Resource $resource, float $rating): Resource
    {
        $resource->submitRating($rating);

        // Re-score after each new rating since community rating is 20% of score
        $resource->load('skill');
        $levelScore = $this->levelScore(
            $resource->difficulty_level,
            $resource->skill->difficulty_level ?? 'Beginner'
        );
        $resource->recalculateRelevanceScore($levelScore);

        return $resource;
    }

    // ── Public: recommended resources for a skill ─────────────

    /**
     * Returns top N resources for a skill, ranked by relevance_score.
     * Excludes IDs the user has already completed.
     * Respects user's preferred resource types if provided.
     *
     * @param int   $skillId
     * @param array $excludeIds       Laravel resource IDs already completed
     * @param array $preferredTypes   e.g. ['video','article']
     * @param int   $limit
     */
    public function recommended(
        int   $skillId,
        array $excludeIds    = [],
        array $preferredTypes = [],
        int   $limit         = 10
    ): Collection {
        $query = Resource::with('skill')
            ->recommendedForSkill($skillId, $excludeIds);

        if (!empty($preferredTypes)) {
            // Prefer matching types but don't exclude others —
            // use a raw CASE to float preferred types to the top
            $types = implode(
                ', ',
                array_map(fn($t) => "'$t'", $preferredTypes)
            );
            $query->orderByRaw("CASE WHEN resource_type IN ({$types}) THEN 0 ELSE 1 END");
        }

        return $query->limit($limit)->get();
    }

    // ── Internal: serve to Node.js quiz/task services ──────────

    /**
     * Returns resources for a skill scoped to a difficulty level.
     * Called server-to-server by the Node backend (study suggestions after quiz fail).
     */
    public function forSkillAndLevel(int $skillId, string $level, int $limit = 5): Collection
    {
        return Resource::active()
            ->where('skill_id', $skillId)
            ->ofLevel($level)
            ->orderByDesc('relevance_score')
            ->limit($limit)
            ->get();
    }

    // ── Private helpers ────────────────────────────────────────

    /**
     * Map a resource's difficulty against the skill's base difficulty
     * to produce a 0–1 level-appropriateness score used in relevance scoring.
     */
    private function levelScore(string $resourceLevel, string $skillLevel): float
    {
        $levels = ['Beginner' => 0, 'Intermediate' => 1, 'Advanced' => 2];

        $r = $levels[$resourceLevel] ?? 0;
        $s = $levels[$skillLevel]    ?? 0;

        // Perfect match = 1.0, one level off = 0.6, two levels off = 0.2
        $diff = abs($r - $s);
        return match ($diff) {
            0       => 1.0,
            1       => 0.6,
            default => 0.2,
        };
    }
}