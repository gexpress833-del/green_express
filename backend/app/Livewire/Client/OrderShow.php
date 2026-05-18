<?php

namespace App\Livewire\Client;

use App\Models\Order;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('layouts.app')]
class OrderShow extends Component
{
    public Order $order;

    public function mount(Order $order): void
    {
        abort_unless((int) $order->user_id === (int) auth()->id(), 403);
        $this->order = $order->load(['items.menu']);
    }

    public function render()
    {
        return view('livewire.client.order-show');
    }
}
