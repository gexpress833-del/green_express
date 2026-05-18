<div class="mx-auto max-w-4xl px-4 py-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
        <h1 class="text-xl font-semibold text-zinc-900">Mes commandes</h1>
        <div class="flex flex-wrap items-center gap-3">
            <label class="flex flex-col gap-1 text-xs font-medium text-zinc-500">
                <span class="sr-only">Filtrer par statut</span>
                <span aria-hidden="true">Statut</span>
                <select
                    wire:model.live="statusFilter"
                    class="min-w-[12rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                    @foreach ($statusOptions as $value => $label)
                        <option value="{{ $value }}">{{ $label }}</option>
                    @endforeach
                </select>
            </label>
            <a href="{{ route('client.menus') }}" class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                Nouvelle commande
            </a>
        </div>
    </div>

    <ul class="mt-6 space-y-3">
        @forelse ($orders as $order)
            <li>
                <a
                    href="{{ route('client.orders.show', $order) }}"
                    class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm hover:border-emerald-300"
                >
                    <span class="font-medium text-zinc-900">#{{ $order->id }}</span>
                    <span class="text-sm text-zinc-600">{{ $order->created_at?->translatedFormat('d/m/Y H:i') }}</span>
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium {{ \App\Support\OrderStatusPresenter::badgeClasses($order->status) }}">
                        {{ \App\Support\OrderStatusPresenter::label($order->status) }}
                    </span>
                    <span class="text-sm font-semibold text-emerald-800">
                        {{ \App\Support\MoneyFormatter::format((float) $order->total_amount, (string) ($order->currency ?? 'CDF')) }}
                    </span>
                </a>
            </li>
        @empty
            <li class="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
                @if ($statusFilter !== '')
                    Aucune commande pour ce statut.
                    <span class="mt-2 block">
                        <button type="button" wire:click="$set('statusFilter', '')" class="font-medium text-emerald-700 hover:underline">
                            Afficher toutes les commandes
                        </button>
                    </span>
                @else
                    Aucune commande pour l’instant.
                    <a href="{{ route('client.menus') }}" class="mt-2 inline-block font-medium text-emerald-700 hover:underline">Parcourir les menus</a>
                @endif
            </li>
        @endforelse
    </ul>

    <div class="mt-6">
        {{ $orders->links() }}
    </div>
</div>
