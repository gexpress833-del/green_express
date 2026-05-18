<?php

namespace App\Livewire\Client;

use App\Models\Order;
use App\Support\OrderStatusPresenter;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('layouts.app')]
#[Title('Mes commandes')]
class OrdersIndex extends Component
{
    use WithPagination;

    public string $statusFilter = '';

    public function updatingStatusFilter(): void
    {
        $this->resetPage();
    }

    public function render()
    {
        $orders = Order::query()
            ->with(['items.menu'])
            ->where('user_id', auth()->id())
            ->when($this->statusFilter !== '', fn ($q) => $q->where('status', $this->statusFilter))
            ->orderByDesc('created_at')
            ->paginate(10);

        return view('livewire.client.orders-index', [
            'orders' => $orders,
            'statusOptions' => OrderStatusPresenter::filterOptions(),
        ]);
    }
}
