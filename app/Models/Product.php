<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
   use HasFactory;
    protected $fillable = [
        'name', 'slug', 'sku', 'description', 'image_path', 'price', 'stock', 'is_active',
    ];

    protected $casts = [
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // ── Scopes ────────────────────────────────────────────────

    /** Filter by active status */
    public function scopeActive(Builder $query, ?bool $isActive): Builder
    {
        if (is_null($isActive)) {
            return $query;
        }
        return $query->where('is_active', $isActive);
    }

    /** Filter by minimum price */
    public function scopeMinPrice(Builder $query, ?float $min): Builder
    {
        return $min !== null ? $query->where('price', '>=', $min) : $query;
    }

    /** Filter by maximum price */
    public function scopeMaxPrice(Builder $query, ?float $max): Builder
    {
        return $max !== null ? $query->where('price', '<=', $max) : $query;
    }

    /** Search by name or description */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term): void {
            $q->where('name', 'like', '%'.$term.'%')
              ->orWhere('description', 'like', '%'.$term.'%');
        });
    }

    /**
     * Apply sort — WHITELISTED only (never raw input into ORDER BY)
     * Supported: price_asc | price_desc | name_asc | created_desc
     */
    public function scopeSorted(Builder $query, ?string $sort): Builder
    {
        return match ($sort) {
            'price_asc'    => $query->orderBy('price', 'asc'),
            'price_desc'   => $query->orderBy('price', 'desc'),
            'name_asc'     => $query->orderBy('name', 'asc'),
            'created_desc' => $query->orderBy('created_at', 'desc'),
            default        => $query->orderBy('created_at', 'desc'),
        };
    }
}