<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use App\Http\Requests\StoreSkillRequest;
use App\Http\Requests\UpdateSkillRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkillController extends Controller
{
    // GET /api/skills
    public function index(Request $request): JsonResponse
    {
        $query = Skill::active();

        // Filter by category: GET /api/skills?category=Frontend
        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        // Search by name: GET /api/skills?search=react
        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        $skills = $query->orderBy('category')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => ['skills' => $skills],
        ]);
    }

    // GET /api/skills/:id
    public function show(string $id): JsonResponse
    {
        $skill = Skill::with('resources')->find($id);

        if (!$skill) {
            return response()->json([
                'success' => false,
                'message' => 'Skill not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => ['skill' => $skill],
        ]);
    }

    // POST /api/skills
    public function store(StoreSkillRequest $request): JsonResponse
    {
        $skill = Skill::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Skill created successfully.',
            'data'    => ['skill' => $skill],
        ], 201);
    }

    // PUT /api/skills/:id
    public function update(UpdateSkillRequest $request, string $id): JsonResponse
    {
        $skill = Skill::find($id);

        if (!$skill) {
            return response()->json([
                'success' => false,
                'message' => 'Skill not found.',
            ], 404);
        }

        $skill->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Skill updated successfully.',
            'data'    => ['skill' => $skill->fresh()],
        ]);
    }

    // DELETE /api/skills/:id
    public function destroy(string $id): JsonResponse
    {
        $skill = Skill::find($id);

        if (!$skill) {
            return response()->json([
                'success' => false,
                'message' => 'Skill not found.',
            ], 404);
        }

        // Soft delete via is_active flag — keeps resource references intact
        $skill->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Skill deleted successfully.',
        ]);
    }

    // GET /api/skills/categories
    public function categories(): JsonResponse
    {
        $categories = Skill::active()
            ->distinct('category')
            ->pluck('category')
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'data'    => ['categories' => $categories],
        ]);
    }
}