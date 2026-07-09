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
// Browse & filter
Route::get('/resources',                    [ResourceController::class, 'index']);
Route::get('/resources/recommended',        [ResourceController::class, 'recommended']);
Route::get('/resources/{id}',               [ResourceController::class, 'show']);

// Any authenticated user can rate
Route::post('/resources/{id}/rate',         [ResourceController::class, 'rate']);

// ─── Protected routes — require valid JWT (admin operations) ───────────────────
Route::middleware('jwt.verify')->group(function () {
    Route::post('/skills',            [SkillController::class, 'store']);
    Route::put('/skills/{id}',        [SkillController::class, 'update']);
    Route::delete('/skills/{id}',     [SkillController::class, 'destroy']);

    Route::post('/resources',                           [ResourceController::class, 'store']);
        Route::put('/resources/{id}',                       [ResourceController::class, 'update']);
        Route::delete('/resources/{id}',                    [ResourceController::class, 'destroy']);
        Route::patch('/resources/{id}/deprecated',          [ResourceController::class, 'toggleDeprecated']);
        Route::patch('/resources/{id}/verified',            [ResourceController::class, 'toggleVerified']);

    
});