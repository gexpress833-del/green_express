{{-- Panneau devise + interrupteur (partagé menus / panier) --}}
<div class="mb-10 w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 class="text-lg font-semibold tracking-tight text-zinc-900">Devise</h2>
    <p class="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
        Tous les prix et le total utilisent la devise sélectionnée.
    </p>
    <p class="mt-2 text-xs text-zinc-500">
        Référence : 1&nbsp;USD = <span class="font-medium tabular-nums text-zinc-800">{{ number_format($usdCdfRate, 0, ',', ' ') }}&nbsp;FC</span>
    </p>

    <div class="mt-5 w-full max-w-[280px]" role="group" aria-label="Choisir francs ou dollars">
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Affichage</p>
        <div
            class="relative box-border h-14 w-full overflow-hidden rounded-full border border-zinc-400/35 bg-gradient-to-r from-emerald-100/90 via-zinc-200 to-sky-100/90 p-1 shadow-inner"
        >
            <span
                class="pointer-events-none absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-md ring-1 ring-zinc-300/90 transition-[left,box-shadow] duration-300 ease-out
                    {{ $preferredCurrency === 'USD' ? 'left-[calc(50%+0.125rem)]' : 'left-1' }}"
                aria-hidden="true"
            ></span>
            <div class="ge-currency-switch relative z-10 h-12 w-full">
                <button
                    type="button"
                    wire:click="setPreferredCurrency('CDF')"
                    class="inline-flex h-12 items-center justify-center rounded-full text-sm font-bold leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:text-base
                        {{ $preferredCurrency === 'CDF' ? 'text-emerald-800' : 'text-zinc-500' }}"
                >
                    FC
                </button>
                <button
                    type="button"
                    wire:click="setPreferredCurrency('USD')"
                    class="inline-flex h-12 items-center justify-center rounded-full text-sm font-bold leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:text-base
                        {{ $preferredCurrency === 'USD' ? 'text-blue-800' : 'text-zinc-500' }}"
                >
                    USD
                </button>
            </div>
        </div>
    </div>
</div>
