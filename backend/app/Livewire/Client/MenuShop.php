<?php

namespace App\Livewire\Client;

use App\Livewire\Client\Concerns\ManagesClientCart;
use App\Services\Menus\ApprovedMenuCatalogService;
use App\Support\MenuPriceConverter;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('layouts.app')]
#[Title('Menus disponibles')]
class MenuShop extends Component
{
    use ManagesClientCart;
    use WithPagination;

    public string $search = '';

    public function mount(): void
    {
        $this->initializeClientCartState();
    }

    public function updatingSearch(): void
    {
        $this->resetPage();
    }

    public function render(ApprovedMenuCatalogService $catalog)
    {
        $this->usdCdfRate = MenuPriceConverter::defaultUsdCdfRate();

        $search = trim($this->search);
        $menus = $catalog->paginate($search !== '' ? $search : null, 12);

        $catalogueLabel = now()->locale('fr_FR')->isoFormat('dddd D MMMM YYYY');

        return view('livewire.client.menu-shop', [
            'menus' => $menus,
            'catalogueLabel' => $catalogueLabel,
        ]);
    }
}
