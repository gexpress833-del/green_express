<div class="mx-auto max-w-4xl space-y-6">
    <div>
        <p class="text-sm font-medium uppercase tracking-wide text-emerald-700">Compte</p>
        <h1 class="mt-1 text-2xl font-semibold text-zinc-900">Mon profil</h1>
        <p class="mt-2 text-sm text-zinc-600">Modifiez vos informations personnelles et votre mot de passe.</p>

        @if ((auth()->user()->role ?? null) === 'client')
            <nav class="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Raccourcis espace client">
                <a href="{{ route('client.menus') }}" class="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-emerald-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/60">
                    ← Menus & commander
                </a>
                <a href="{{ route('client.cart') }}" class="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/60">
                    Mon panier
                </a>
                <a href="{{ route('client.orders.index') }}" class="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/60">
                    Mes commandes
                </a>
                <a href="{{ route('client.home') }}" class="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/60">
                    Espace client
                </a>
            </nav>
        @endif
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
        <form wire:submit.prevent="updateProfile" class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-zinc-900">Informations personnelles</h2>

            @if (session('profile_status'))
                <div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {{ session('profile_status') }}
                </div>
            @endif

            <div class="mt-5 space-y-4">
                <div>
                    <label for="name" class="mb-1 block text-sm font-medium text-zinc-700">Nom</label>
                    <input wire:model.blur="name" id="name" type="text" class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 @error('name') border-red-500 @enderror" />
                    @error('name') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label for="email" class="mb-1 block text-sm font-medium text-zinc-700">E-mail</label>
                    <input wire:model.blur="email" id="email" type="email" class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 @error('email') border-red-500 @enderror" />
                    @error('email') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label for="phone" class="mb-1 block text-sm font-medium text-zinc-700">Téléphone</label>
                    <input wire:model.blur="phone" id="phone" type="text" class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 @error('phone') border-red-500 @enderror" />
                    @error('phone') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
                </div>
            </div>

            <button type="submit" wire:loading.attr="disabled" wire:target="updateProfile" class="mt-6 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                <span wire:loading.remove wire:target="updateProfile">Enregistrer</span>
                <span wire:loading wire:target="updateProfile">Enregistrement…</span>
            </button>
        </form>

        <form wire:submit.prevent="updatePassword" class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-zinc-900">Sécurité</h2>

            @if (session('password_status'))
                <div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {{ session('password_status') }}
                </div>
            @endif

            <div class="mt-5 space-y-4">
                <div>
                    <label for="current_password" class="mb-1 block text-sm font-medium text-zinc-700">Mot de passe actuel</label>
                    <input wire:model.blur="current_password" id="current_password" type="password" class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 @error('current_password') border-red-500 @enderror" />
                    @error('current_password') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label for="password" class="mb-1 block text-sm font-medium text-zinc-700">Nouveau mot de passe</label>
                    <input wire:model.blur="password" id="password" type="password" class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 @error('password') border-red-500 @enderror" />
                    @error('password') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label for="password_confirmation" class="mb-1 block text-sm font-medium text-zinc-700">Confirmation</label>
                    <input wire:model.blur="password_confirmation" id="password_confirmation" type="password" class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
                </div>
            </div>

            <button type="submit" wire:loading.attr="disabled" wire:target="updatePassword" class="mt-6 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60">
                <span wire:loading.remove wire:target="updatePassword">Changer le mot de passe</span>
                <span wire:loading wire:target="updatePassword">Mise à jour…</span>
            </button>
        </form>
    </div>
</div>
