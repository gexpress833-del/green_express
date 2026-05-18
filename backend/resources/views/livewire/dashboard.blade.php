<div class="mx-auto max-w-6xl space-y-8">
    <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-medium uppercase tracking-wide text-emerald-700">Tableau de bord</p>
        <h1 class="mt-1 text-2xl font-semibold text-zinc-900">
            Bonjour, {{ auth()->user()->name }}
        </h1>
        <p class="mt-2 text-zinc-600">
            <span class="font-medium text-zinc-800">{{ $roleLabel }}</span>
            <span class="text-zinc-400"> · </span>
            <span class="font-mono text-sm text-zinc-500">{{ auth()->user()->role ?? '—' }}</span>
        </p>
    </div>

    @if (! empty($clientMenusUrl))
        <div class="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/80 p-6 shadow-sm ring-1 ring-emerald-700/10">
            <h2 class="text-lg font-semibold text-emerald-900">Commander vos repas</h2>
            <p class="mt-2 max-w-2xl text-sm text-emerald-800/90">
                Parcourez les menus approuvés, ajoutez des plats au panier et validez une ou plusieurs commandes quand vous le souhaitez.
            </p>
            <p class="mt-4">
                <a
                    href="{{ $clientMenusUrl }}"
                    class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                    Voir les menus et commander
                    <span aria-hidden="true">→</span>
                </a>
            </p>
        </div>
    @endif

    <div>
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Vue d’ensemble</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($stats as $stat)
                <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <p class="text-sm text-zinc-500">{{ $stat['label'] }}</p>
                    <p class="mt-2 text-2xl font-semibold text-zinc-900">{{ $stat['value'] }}</p>
                </div>
            @endforeach
        </div>
    </div>

    <div>
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Accès rapides</h2>
        <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($quickLinks as $link)
                <li>
                    @if (! empty($link['soon']))
                        <span class="flex cursor-not-allowed items-center justify-between rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-500">
                            <span>{{ $link['label'] }}</span>
                            <span class="text-xs text-zinc-400">Bientôt</span>
                        </span>
                    @else
                        <a
                            href="{{ $link['href'] }}"
                            @if (! empty($link['external'])) target="_blank" rel="noopener noreferrer" @endif
                            class="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-800 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/50"
                        >
                            {{ $link['label'] }}
                            @if (! empty($link['external']))
                                <span class="text-xs text-zinc-400">↗</span>
                            @endif
                        </a>
                    @endif
                </li>
            @endforeach
        </ul>
    </div>
</div>
