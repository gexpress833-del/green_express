<?php

namespace App\Services\Menus;

use App\Models\Menu;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Liste paginée des menus approuvés (catalogue client).
 * Aligné sur MenuController::browse pour garder le même comportement API / Livewire.
 */
class ApprovedMenuCatalogService
{
    public function paginate(?string $search = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Menu::query()->where('status', 'approved');

        $search = $search !== null ? trim($search) : '';
        if ($search !== '') {
            $query->where('title', 'like', '%'.$search.'%');
        }

        $perPage = min(max($perPage, 1), 100);

        return $query->orderByDesc('created_at')->paginate($perPage);
    }
}
