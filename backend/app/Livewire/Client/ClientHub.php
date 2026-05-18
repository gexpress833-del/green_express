<?php

namespace App\Livewire\Client;

use App\Models\Menu;
use App\Models\Order;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Espace client')]
class ClientHub extends Component
{
    public function render()
    {
        $user = auth()->user();
        $cart = session('client_cart', []);

        return view('livewire.client.client-hub', [
            'ordersCount' => Order::query()->where('user_id', $user->id)->count(),
            'menusCount' => Menu::query()->where('status', 'approved')->count(),
            'cartLines' => is_array($cart) ? count($cart) : 0,
        ]);
    }
}
