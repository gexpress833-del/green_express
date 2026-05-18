<div class="mx-auto max-w-5xl space-y-8 px-4 py-8">
    <div class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-8 text-white shadow-lg shadow-emerald-900/20">
        <p class="text-xs font-medium uppercase tracking-widest text-emerald-100/90">Espace client</p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight">Bonjour, {{ auth()->user()->name }}</h1>
        <p class="mt-3 max-w-xl text-sm text-emerald-50/95">
            Accédez rapidement aux menus, à votre panier et à vos commandes.
        </p>
        <p class="mt-6">
            <a
                href="{{ route('client.menus') }}"
                class="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
                Voir les menus et commander
                <span aria-hidden="true">→</span>
            </a>
        </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p class="text-sm text-zinc-500">Commandes</p>
            <p class="mt-2 text-3xl font-bold tabular-nums text-zinc-900">{{ $ordersCount }}</p>
        </div>
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p class="text-sm text-zinc-500">Plats au catalogue</p>
            <p class="mt-2 text-3xl font-bold tabular-nums text-zinc-900">{{ $menusCount }}</p>
        </div>
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p class="text-sm text-zinc-500">Lignes dans le panier</p>
            <p class="mt-2 text-3xl font-bold tabular-nums text-emerald-700">{{ $cartLines }}</p>
        </div>
    </div>

    <div>
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Raccourcis</h2>
        <ul class="grid gap-3 sm:grid-cols-2">
            <li>
                <a
                    href="{{ route('client.menus') }}"
                    class="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 font-medium text-zinc-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                    Menus & commander
                    <span class="text-zinc-400" aria-hidden="true">→</span>
                </a>
            </li>
            <li>
                <a
                    href="{{ route('client.cart') }}"
                    class="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 font-medium text-zinc-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                    Mon panier
                    @if ($cartLines > 0)
                        <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">{{ $cartLines }}</span>
                    @else
                        <span class="text-zinc-400" aria-hidden="true">→</span>
                    @endif
                </a>
            </li>
            <li>
                <a
                    href="{{ route('client.orders.index') }}"
                    class="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 font-medium text-zinc-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                    Mes commandes
                    <span class="text-zinc-400" aria-hidden="true">→</span>
                </a>
            </li>
            <li>
                <a
                    href="{{ route('profile') }}"
                    class="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 font-medium text-zinc-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                    Mon profil
                    <span class="text-zinc-400" aria-hidden="true">→</span>
                </a>
            </li>
            <li>
                <a
                    href="{{ route('dashboard') }}"
                    class="flex items-center justify-between rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-white"
                >
                    Tableau de bord général
                    <span class="text-zinc-400" aria-hidden="true">↗</span>
                </a>
            </li>
        </ul>
    </div>
</div>
