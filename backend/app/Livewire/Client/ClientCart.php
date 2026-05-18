<?php

namespace App\Livewire\Client;

use App\Livewire\Client\Concerns\ManagesClientCart;
use App\Support\MenuPriceConverter;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Mon panier')]
class ClientCart extends Component
{
    use ManagesClientCart;

    public function mount(): void
    {
        $this->initializeClientCartState();
    }

    public function render()
    {
        $this->usdCdfRate = MenuPriceConverter::defaultUsdCdfRate();

        return view('livewire.client.client-cart');
    }
}
