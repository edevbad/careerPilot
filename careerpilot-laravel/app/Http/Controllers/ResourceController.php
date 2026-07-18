<?php

namespace App\Http\Controllers;

use App\Http\Requests\Resource\StoreResourceRequest;
use App\Http\Requests\Resource\UpdateResourceRequest;
use App\Http\Requests\Resource\RateResourceRequest;
use App\Http\Resources\ResourceResource;
use App\Models\Resource;
use App\Services\ResourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ResourceController extends Controller
{
    public function __construct(private readonly ResourceService $service) {}

    // ── GET /api/resources ─────────────────────────────────────
    /**
     * Paginated, filtered resource listing.
     *
     * Query params:
     *   skill_id, resource_type, difficulty_level, is_verified,
     *   search, sort_by, sort_dir, per_page
     *   include_deprecated (admin only)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $isAdmin   = $request->user()?->role === 'admin';
        $resources = $this->service->list($request->query(), $isAdmin);

        return ResourceResource::collection($resources);
    }

    // ── POST /api/resources ────────────────────────────────────
    /**
     * Create a new resource. Admin only.
     */
    public function store(StoreResourceRequest $request): JsonResponse
    {
        $resource = $this->service->create($request->validated());

        return (new ResourceResource($resource))
            ->response()
            ->setStatusCode(201);
    }

    // ── GET /api/resources/:id ─────────────────────────────────
    /**
     * Single resource detail with skill loaded.
     */
    public function show(int $id): ResourceResource
    {
        $resource = $this->service->findOrFail($id);
        return new ResourceResource($resource);
    }

    // ── PUT /api/resources/:id ─────────────────────────────────
    /**
     * Update a resource. Admin only.
     */
    public function update(UpdateResourceRequest $request, int $id): ResourceResource
    {
        $resource = Resource::findOrFail($id);
        $updated  = $this->service->update($resource, $request->validated());

        return new ResourceResource($updated);
    }

    // ── DELETE /api/resources/:id ──────────────────────────────
    /**
     * Soft-delete a resource. Admin only.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $resource = Resource::findOrFail($id);
        $this->service->delete($resource);

        return response()->json(['message' => 'Resource deleted successfully']);
    }

    // ── PATCH /api/resources/:id/deprecated ───────────────────
    /**
     * Toggle deprecated flag. Admin only.
     * Deprecated resources are hidden from all non-admin queries.
     */
    public function toggleDeprecated(Request $request, int $id): ResourceResource
    {
        if ($request->user()?->role !== 'admin') {
            abort(403, 'Forbidden');
        }

        $resource = Resource::findOrFail($id);
        $updated  = $this->service->toggleDeprecated($resource);

        return new ResourceResource($updated);
    }

    // ── PATCH /api/resources/:id/verified ─────────────────────
    /**
     * Toggle verified flag. Admin only.
     * Verified resources get a relevance score boost.
     */
    public function toggleVerified(Request $request, int $id): ResourceResource
    {
        if ($request->user()?->role !== 'admin') {
            abort(403, 'Forbidden');
        }

        $resource = Resource::findOrFail($id);
        $updated  = $this->service->toggleVerified($resource);

        return new ResourceResource($updated);
    }

    // ── POST /api/resources/:id/rate ──────────────────────────
    /**
     * Submit a rating (1–5) for a resource. Any authenticated user.
     * Uses a rolling average — rating_count tracks total votes.
     */
    public function rate(RateResourceRequest $request, int $id): JsonResponse
    {
        $resource = Resource::active()->findOrFail($id);
        $updated  = $this->service->rate($resource, (float) $request->validated('rating'));

        return response()->json([
            'message'     => 'Rating submitted successfully',
            'newRating'   => $updated->rating,
            'ratingCount' => $updated->rating_count,
        ]);
    }

    // ── GET /api/resources/recommended ────────────────────────
    /**
     * Get recommended resources for a skill.
     *
     * Query params:
     *   skill_id          (required)
     *   exclude_ids       comma-separated list of completed resource IDs
     *   preferred_types   comma-separated e.g. "video,article"
     *   limit             default 10, max 20
     */
    public function recommended(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'skill_id'        => ['required', 'integer', 'exists:skills,id'],
            'exclude_ids'     => ['sometimes', 'string'],
            'preferred_types' => ['sometimes', 'string'],
            'limit'           => ['sometimes', 'integer', 'min:1', 'max:20'],
        ]);

        $excludeIds     = $request->exclude_ids
            ? array_map('intval', explode(',', $request->exclude_ids))
            : [];

        $preferredTypes = $request->preferred_types
            ? explode(',', $request->preferred_types)
            : [];

        $resources = $this->service->recommended(
            skillId:       (int) $request->skill_id,
            excludeIds:    $excludeIds,
            preferredTypes: $preferredTypes,
            limit:          (int) ($request->limit ?? 10),
        );

        return ResourceResource::collection($resources);
    }

    // ── GET /api/internal/resources ───────────────────────────
    /**
     * Server-to-server endpoint consumed by Node.js (study suggestions).
     * Requires X-Internal-Key header — not exposed in public API docs.
     */
    public function internal(Request $request): JsonResponse
    {
        if ($request->header('X-Internal-Key') !== config('services.internal_key')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'skill_id' => ['required', 'integer'],
            'level'    => ['required', 'in:Beginner,Intermediate,Advanced'],
            'limit'    => ['sometimes', 'integer', 'min:1', 'max:10'],
        ]);

        $resources = $this->service->forSkillAndLevel(
            (int) $request->skill_id,
            $request->level,
            (int) ($request->limit ?? 5)
        );

        return response()->json([
            'resources' => ResourceResource::collection($resources),
        ]);
    }
}