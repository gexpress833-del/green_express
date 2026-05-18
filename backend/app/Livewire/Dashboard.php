<?php

namespace App\Livewire;

use App\Models\Menu;
use App\Models\Order;
use App\Models\User;
use App\Support\WebDashboardQuickLinks;
use Illuminate\Support\Facades\Route;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Tableau de bord')]
class Dashboard extends Component
{
    public function render()
    {
        $user = auth()->user();
        $role = $user?->role;
        $roleLabel = $role
            ? (string) config('roles.roles.'.$role.'.label', $role)
            : '—';

        return view('livewire.dashboard', [
            'quickLinks' => WebDashboardQuickLinks::forRole($role),
            'roleLabel' => $roleLabel,
            'stats' => $this->statsForRole($role),
            'clientMenusUrl' => $role === 'client' && Route::has('client.menus') ? route('client.menus') : null,
        ]);
    }

    private function statsForRole(?string $role): array
    {
        $user = auth()->user();
        $rawCart = session('client_cart', []);
        $cartLineCount = is_array($rawCart) ? count($rawCart) : 0;

        return match ($role) {
            'admin' => [
                ['label' => 'Utilisateurs', 'value' => User::query()->count()],
                ['label' => 'Commandes', 'value' => Order::query()->count()],
                ['label' => 'Menus', 'value' => Menu::query()->count()],
            ],
            'client' => [
                ['label' => 'Menus disponibles', 'value' => Menu::query()->where('status', 'approved')->count()],
                ['label' => 'Lignes dans le panier', 'value' => $cartLineCount],
                ['label' => 'Mes commandes', 'value' => Order::query()->where('user_id', $user->id)->count()],
            ],
            'cuisinier' => [
                ['label' => 'Mes menus', 'value' => Menu::query()->where('user_id', $user->id)->count()],
                ['label' => 'Menus approuvés', 'value' => Menu::query()->where('user_id', $user->id)->where('status', 'approved')->count()],
            ],
            default => [
                ['label' => 'Rôle', 'value' => $role ?: '—'],
            ],
        };
    }
}
