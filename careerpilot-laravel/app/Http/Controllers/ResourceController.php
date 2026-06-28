<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use App\Models\Skill;
use App\Http\Requests\StoreResourceRequest;
use App\Http\Requests\UpdateResourceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    // GET /api/resources
    public function index(Request $request): JsonResponse
    {
        $query = Resource::active();

        // Filter by skill: GET /api/resources?skill_id=abc123
        if ($request->filled('skill_id')) {
            $query->forSkill($request->skill_id);
        }

        // Filter by type: GET /api/resources?type=course
        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        // Filter free only: GET /api/resources?is_free=true
        if ($request->filled('is_free')) {
            $query->where('is_free', filter_var($request->is_free, FILTER_VALIDATE_BOOLEAN));
        }

        // Search by title: GET /api/resources?search=node
        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%');
        }

        $resources = $query->orderBy('type')->orderBy('title')->get();

        return response()->json([
            'success' => true,
            'data'    => ['resources' => $resources],
        ]);
    }

    // GET /api/resources/:id
    public function show(string $id): JsonResponse
    {
        $resource = Resource::find($id);

        if (!$resource) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => ['resource' => $resource],
        ]);
    }

    // POST /api/resources
    public function store(StoreResourceRequest $request): JsonResponse
    {
        // Verify the skill exists
        $skill = Skill::find($request->skill_id);
        if (!$skill) {
            return response()->json([
                'success' => false,
                'message' => 'The provided skill_id does not exist.',
            ], 422);
        }

        $resource = Resource::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Resource created successfully.',
            'data'    => ['resource' => $resource],
        ], 201);
    }

    // PUT /api/resources/:id
    public function update(UpdateResourceRequest $request, string $id): JsonResponse
    {
        $resource = Resource::find($id);

        if (!$resource) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        }

        // If skill_id is being changed, verify the new skill exists
        if ($request->filled('skill_id')) {
            $skill = Skill::find($request->skill_id);
            if (!$skill) {
                return response()->json([
                    'success' => false,
                    'message' => 'The provided skill_id does not exist.',
                ], 422);
            }
        }

        $resource->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Resource updated successfully.',
            'data'    => ['resource' => $resource->fresh()],
        ]);
    }

    // DELETE /api/resources/:id
    public function destroy(string $id): JsonResponse
    {
        $resource = Resource::find($id);

        if (!$resource) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        }

        $resource->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Resource deleted successfully.',
        ]);
    }
}