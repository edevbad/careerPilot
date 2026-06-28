<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Resource extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'resources';

    protected $fillable = [
        'title',
        'url',
        'type',         // course | documentation | tutorial | article
        'skill_id',
        'description',
        'is_free',
        'is_active',
    ];

    protected $casts = [
        'is_free'   => 'boolean',
        'is_active' => 'boolean',
    ];

    protected $attributes = [
        'is_free'   => true,
        'is_active' => true,
    ];

    // ─── Relationships ──────────────────────────────────────────────────────────

    public function skill()
    {
        return $this->belongsTo(Skill::class, 'skill_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForSkill($query, string $skillId)
    {
        return $query->where('skill_id', $skillId);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}