<div class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
    <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Créer un compte client</h1>
        <p class="mt-2 text-sm text-zinc-600">Compte particulier — même logique métier que l’API /api/register.</p>
    </div>

    <form wire:submit="register" class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div class="space-y-4">
            <div>
                <label class="mb-1 block text-sm font-medium text-zinc-700" for="name">Nom</label>
                <input wire:model.blur="name" id="name" type="text" autocomplete="name"
                    class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 @error('name') border-red-500 @enderror" />
                @error('name') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-zinc-700" for="email">E-mail</label>
                <input wire:model.blur="email" id="email" type="email" autocomplete="email"
                    class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 @error('email') border-red-500 @enderror" />
                @error('email') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-zinc-700" for="phone">Téléphone (RDC)</label>
                <input wire:model.blur="phone" id="phone" type="text" autocomplete="tel"
                    class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 @error('phone') border-red-500 @enderror" />
                @error('phone') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-zinc-700" for="password">Mot de passe</label>
                <input wire:model.blur="password" id="password" type="password" autocomplete="new-password"
                    class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 @error('password') border-red-500 @enderror" />
                @error('password') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-zinc-700" for="password_confirmation">Confirmation</label>
                <input wire:model.blur="password_confirmation" id="password_confirmation" type="password" autocomplete="new-password"
                    class="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
            </div>
        </div>

        <button type="submit"
            class="mt-6 flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            wire:loading.attr="disabled">
            <span wire:loading.remove wire:target="register">S’inscrire</span>
            <span wire:loading wire:target="register">Inscription…</span>
        </button>
    </form>

    <p class="mt-6 text-center text-sm text-zinc-600">
        Déjà un compte ?
        <a href="{{ route('login') }}" class="font-medium text-emerald-700 hover:text-emerald-800">Connexion</a>
    </p>
</div>
