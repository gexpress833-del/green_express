<div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800 dark:bg-zinc-900">
        <div>
            <p class="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Administration</p>
            <h1 class="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ $title }}</h1>
        </div>
        <input wire:model.live.debounce.300ms="search" type="search" placeholder="Rechercher..." class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-emerald-500" />
    </div>

    @if (session('admin_status'))
        <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{{ session('admin_status') }}</div>
    @endif

    @if (session('admin_error'))
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">{{ session('admin_error') }}</div>
    @endif

    @if (in_array($section, ['menus', 'users'], true))
        <form id="admin-resource-form" wire:submit.prevent="save" class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div class="mb-5 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ $editingId ? 'Modifier' : 'Créer' }}</h2>
                @if ($editingId)
                    <button type="button" wire:click="resetForm" class="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Annuler</button>
                @endif
            </div>

            @if ($section === 'menus')
                <div class="grid gap-4 lg:grid-cols-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Titre</label>
                        <input wire:model.blur="form.title" type="text" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                        @error('form.title') <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Prix</label>
                        <input wire:model.blur="form.price" type="number" step="0.01" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Devise</label>
                        <select wire:model="form.currency" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                            <option value="USD">USD</option>
                            <option value="CDF">CDF</option>
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Statut</label>
                        <select wire:model="form.status" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                            <option value="draft">Brouillon</option>
                            <option value="pending">En attente</option>
                            <option value="approved">Approuvé</option>
                            <option value="rejected">Rejeté</option>
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Cuisinier</label>
                        <select wire:model="form.created_by" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                            <option value="">Non assigné</option>
                            @foreach ($chefs as $chef)
                                <option value="{{ $chef->id }}">{{ $chef->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <label class="flex items-center gap-2 pt-7 text-sm text-zinc-700 dark:text-zinc-300">
                        <input wire:model="form.is_available" type="checkbox" class="rounded border-zinc-300 text-emerald-600 dark:border-zinc-600" /> Disponible
                    </label>
                    <div class="lg:col-span-3">
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Photo du repas</label>
                        <input wire:model="photo" type="file" accept="image/*" class="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                        @error('photo') <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ $message }}</p> @enderror

                        <div class="mt-3 flex items-center gap-4">
                            @if ($photo)
                                <img src="{{ $photo->temporaryUrl() }}" alt="Aperçu" class="h-24 w-24 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
                            @elseif (! empty($form['image']))
                                <img src="{{ \App\Services\CloudinaryService::menuThumbImageUrl($form['image']) }}" alt="Menu" class="h-24 w-24 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
                            @endif
                            <div wire:loading wire:target="photo" class="text-sm text-zinc-500 dark:text-zinc-400">Upload en cours…</div>
                        </div>
                    </div>
                    <div class="lg:col-span-3">
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                        <textarea wire:model.blur="form.description" rows="3" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"></textarea>
                    </div>
                </div>
            @endif

            @if ($section === 'users')
                <div class="grid gap-4 lg:grid-cols-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nom</label>
                        <input wire:model.blur="form.name" type="text" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">E-mail</label>
                        <input wire:model.blur="form.email" type="email" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Téléphone</label>
                        <input wire:model.blur="form.phone" type="text" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Rôle</label>
                        <select wire:model="form.role" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                            @foreach (['admin', 'client', 'cuisinier', 'livreur', 'entreprise', 'verificateur', 'secretaire', 'agent'] as $role)
                                <option value="{{ $role }}">{{ ucfirst($role) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mot de passe</label>
                        <input wire:model.blur="form.password" type="password" placeholder="{{ $editingId ? 'Laisser vide pour conserver' : '' }}" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </div>
                </div>
            @endif

            <button type="submit" class="mt-5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500">Enregistrer</button>
        </form>
    @endif

    <div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                <thead class="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <tr>
                        @if ($section === 'menus') <th class="px-4 py-3">Photo</th><th class="px-4 py-3">Menu</th><th class="px-4 py-3">Prix</th><th class="px-4 py-3">Statut</th><th class="px-4 py-3">Cuisinier</th><th class="px-4 py-3">Actions</th> @endif
                        @if ($section === 'users') <th class="px-4 py-3">Utilisateur</th><th class="px-4 py-3">Rôle</th><th class="px-4 py-3">Téléphone</th><th class="px-4 py-3">Actions</th> @endif
                        @if ($section === 'orders') <th class="px-4 py-3">Commande</th><th class="px-4 py-3">Client</th><th class="px-4 py-3">Total</th><th class="px-4 py-3">Statut</th><th class="px-4 py-3">Paiement</th><th class="px-4 py-3">Livreur</th><th class="px-4 py-3 min-w-[14rem]">Actions</th> @endif
                        @if (! in_array($section, ['menus', 'users', 'orders'], true)) <th class="px-4 py-3">Élément</th><th class="px-4 py-3">Statut</th><th class="px-4 py-3">Date</th> @endif
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                    @foreach ($rows as $row)
                        <tr class="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                            @include('livewire.admin.resource-row', ['row' => $row, 'flexpayConfigured' => $flexpayConfigured ?? false])
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @if (method_exists($rows, 'links'))
            <div class="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">{{ $rows->links() }}</div>
        @endif
        @if ($section === 'orders' && $flexPayOrderId)
            <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" wire:keydown.escape.window="closeFlexPayOrderModal">
                <div class="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900" role="dialog" aria-modal="true" aria-labelledby="flexpay-modal-title">
                    <h2 id="flexpay-modal-title" class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Initier FlexPay (Mobile Money)</h2>
                    <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Commande #{{ $flexPayOrderId }} — numéro client à débiter (9 chiffres RDC, ex. 0812345678).
                    </p>
                    @if (! $flexpayConfigured)
                        <p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                            FlexPay n’est pas configuré (<code class="text-xs">FLEXPAY_MERCHANT</code> / <code class="text-xs">FLEXPAY_TOKEN</code>). En dev, activez aussi <code class="text-xs">FLEXPAY_MOCK=true</code>.
                        </p>
                    @endif
                    <form wire:submit.prevent="submitAdminFlexPayInitiation" class="mt-4 space-y-4">
                        <div>
                            <label for="flexpay-phone" class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Téléphone Mobile Money</label>
                            <input id="flexpay-phone" wire:model="flexPayPhoneInput" type="text" autocomplete="tel" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" />
                            @error('flexPayPhoneInput') <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ $message }}</p> @enderror
                        </div>
                        <div class="flex justify-end gap-2">
                            <button type="button" wire:click="closeFlexPayOrderModal" class="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Annuler</button>
                            <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50" @disabled(! $flexpayConfigured)>
                                Envoyer la demande
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        @endif
    </div>

    <script>
        document.addEventListener('livewire:init', () => {
            Livewire.on('admin-resource-editing', () => {
                setTimeout(() => {
                    document.getElementById('admin-resource-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            });
        });
    </script>
</div>
