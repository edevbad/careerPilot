<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\ResourceController;

// Health check — public
Route::get('/health', fn() => response()->json([
    'success'   => true,
    'service'   => 'CareerPilot Laravel API',
    'timestamp' => now()->toISOString(),
]));

// ─── Public routes — anyone can read skills and resources ──────────────────────
Route::get('/skills',              [SkillController::class, 'index']);
Route::get('/skills/categories',   [SkillController::class, 'categories']);
Route::get('/skills/{id}',         [SkillController::class, 'show']);
Route::get('/resources',           [ResourceController::class, 'index']);
Route::get('/resources/{id}',      [ResourceController::class, 'show']);

// ─── Protected routes — require valid JWT (admin operations) ───────────────────
Route::middleware('jwt.verify')->group(function () {
    Route::post('/skills',            [SkillController::class, 'store']);
    Route::put('/skills/{id}',        [SkillController::class, 'update']);
    Route::delete('/skills/{id}',     [SkillController::class, 'destroy']);

    Route::post('/resources',         [ResourceController::class, 'store']);
    Route::put('/resources/{id}',     [ResourceController::class, 'update']);
    Route::delete('/resources/{id}',  [ResourceController::class, 'destroy']);
});