<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Skill extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'skills';   // MongoDB collection name

    protected $fillable = [
        'name',
        'category',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $attributes = [
        'is_active' => true,
    ];

    // ─── Relationships ──────────────────────────────────────────────────────────

    public function resources()
    {
        return $this->hasMany(Resource::class, 'skill_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}