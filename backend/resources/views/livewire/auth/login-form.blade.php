<div class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
    <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">{{ config('app.name', 'Green Express') }}</h1>
        <p class="mt-2 text-sm text-zinc-600">Connexion au tableau de bord (session web)</p>
    </div>

    <form wire:submit="authenticate" class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div class="space-y-4">
            <div>
                <label for="login" class="mb-1 block text-sm font-medium text-zinc-700">E-mail ou téléphone</label>
                <input
                    wire:model.blur="login"
                    id="login"
                    type="text"
                    autocomplete="username"
                    class="@error('login') border-red-500 @enderror mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    autofocus
                />
                @error('login')
                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <div>
                <label for="password" class="mb-1 block text-sm font-medium text-zinc-700">Mot de passe</label>
                <input
                    wire:model.blur="password"
                    id="password"
                    type="password"
                    autocomplete="current-password"
                    class="@error('password') border-red-500 @enderror mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                @error('password')
                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>
        </div>

        <button
            type="submit"
            class="mt-6 flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            wire:loading.attr="disabled"
        >
            <span wire:loading.remove wire:target="authenticate">Se connecter</span>
            <span wire:loading wire:target="authenticate">Connexion…</span>
        </button>
    </form>

    <p class="mt-6 text-center text-sm text-zinc-600">
        Pas encore de compte ?
        <a href="{{ route('register') }}" class="font-medium text-emerald-700 hover:text-emerald-800">Créer un compte</a>
    </p>

    <p class="mt-4 text-center text-xs text-zinc-500">
        Next.js utilise toujours l’API (<code class="rounded bg-zinc-100 px-1">/api/*</code>) avec Sanctum — session distincte du guard web.
    </p>
</div>
