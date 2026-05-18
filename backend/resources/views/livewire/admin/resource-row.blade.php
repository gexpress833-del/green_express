@if ($section === 'menus')
    <td class="px-4 py-3">
        @if ($row->image)
            <img src="{{ \App\Services\CloudinaryService::menuThumbImageUrl($row->image) }}" alt="{{ $row->title }}" class="h-14 w-14 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
        @else
            <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600">Sans photo</div>
        @endif
    </td>
    <td class="px-4 py-3">
        <div class="font-medium text-zinc-900 dark:text-zinc-100">{{ $row->title }}</div>
        <div class="max-w-md truncate text-xs text-zinc-500 dark:text-zinc-400">{{ $row->description }}</div>
    </td>
    <td class="px-4 py-3">{{ number_format((float) $row->price, 2) }} {{ $row->currency }}</td>
    <td class="px-4 py-3"><span class="rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800 dark:text-zinc-300">{{ $row->status }}</span></td>
    <td class="px-4 py-3">{{ $row->creator?->name ?? '—' }}</td>
    <td class="px-4 py-3">
        <div class="flex flex-col gap-2 sm:flex-row">
            <button wire:click="edit({{ $row->id }})" class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800">Modifier</button>
            <button wire:click="delete({{ $row->id }})" wire:confirm="Êtes-vous sûr de vouloir supprimer ce menu ? Cette action est irréversible." class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800">Supprimer</button>
        </div>
    </td>
@endif

@if ($section === 'users')
    <td class="px-4 py-3">
        <div class="font-medium text-zinc-900 dark:text-zinc-100">{{ $row->name }}</div>
        <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ $row->email }}</div>
    </td>
    <td class="px-4 py-3"><span class="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{{ $row->role }}</span></td>
    <td class="px-4 py-3">{{ $row->phone ?? '—' }}</td>
    <td class="px-4 py-3">
        <div class="flex gap-2">
            <button wire:click="edit({{ $row->id }})" class="text-emerald-700 hover:underline dark:text-emerald-400">Modifier</button>
            @if (auth()->id() !== $row->id)
                <button wire:click="delete({{ $row->id }})" wire:confirm="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible." class="text-red-600 hover:underline dark:text-red-400">Supprimer</button>
            @endif
        </div>
    </td>
@endif

@if ($section === 'orders')
    <td class="px-4 py-3">
        <div class="font-medium text-zinc-900 dark:text-zinc-100">#{{ $row->id }}</div>
        <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ $row->uuid }}</div>
    </td>
    <td class="px-4 py-3">{{ $row->user?->name ?? '—' }}</td>
    <td class="px-4 py-3">{{ number_format((float) $row->total_amount, 2) }} {{ $row->currency }}</td>
    <td class="px-4 py-3">
        <select wire:change="updateOrderStatus({{ $row->id }}, $event.target.value)" class="max-w-[11rem] rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            @foreach (\App\Support\OrderStatusPresenter::values() as $status)
                <option value="{{ $status }}" @selected($row->status === $status)>{{ \App\Support\OrderStatusPresenter::label($status) }}</option>
            @endforeach
        </select>
    </td>
    <td class="px-4 py-3">
        @if ($row->payment)
            <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {{ \App\Support\PaymentStatusPresenter::badgeClasses($row->payment->status) }}">
                {{ \App\Support\PaymentStatusPresenter::label($row->payment->status) }}
            </span>
            <div class="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">{{ $row->payment->provider }} · {{ \Illuminate\Support\Str::limit($row->payment->provider_payment_id ?? '—', 14) }}</div>
        @else
            <span class="text-xs text-zinc-400">—</span>
        @endif
    </td>
    <td class="px-4 py-3">
        <select wire:change="assignDriver({{ $row->id }}, $event.target.value)" class="max-w-[10rem] rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Non assigné</option>
            @foreach ($drivers as $driver)
                <option value="{{ $driver->id }}" @selected((int) $row->livreur_id === (int) $driver->id)>{{ $driver->name }}</option>
            @endforeach
        </select>
    </td>
    <td class="px-4 py-3">
        <div class="flex flex-col gap-1.5">
            @if ($row->status === 'pending_payment')
                <button type="button" wire:click="openFlexPayOrderModal({{ $row->id }})" class="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-left text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                    Initier FlexPay…
                </button>
                <button type="button" wire:click="confirmOrderManual({{ $row->id }})" wire:confirm="Confirmer le paiement hors FlexPay (espèces / virement vérifié) et générer le code livraison ?" class="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-left text-[11px] font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                    Paiement manuel
                </button>
            @endif
            @if ($row->payment && $row->payment->status === 'pending' && $row->payment->provider === 'flexpay')
                <button type="button" wire:click="refreshOrderFlexPay({{ $row->id }})" class="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-left text-[11px] font-medium text-sky-900 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                    Sync FlexPay
                </button>
            @endif
        </div>
    </td>
@endif

@if (! in_array($section, ['menus', 'users', 'orders'], true))
    <td class="px-4 py-3">
        @switch($section)
            @case('companies')
                <div class="font-medium text-zinc-900">{{ $row->name }}</div>
                <div class="text-xs text-zinc-500">{{ $row->email }}</div>
                @break
            @case('subscriptions')
                <div class="font-medium text-zinc-900">{{ $row->user?->name ?? 'Client' }}</div>
                <div class="text-xs text-zinc-500">{{ $row->plan }} · {{ $row->price }} {{ $row->currency }}</div>
                @break
            @case('company-subscriptions')
                <div class="font-medium text-zinc-900">{{ $row->company?->name ?? 'Entreprise' }}</div>
                <div class="text-xs text-zinc-500">{{ $row->agent_count }} agents · {{ $row->total_monthly_price }} {{ $row->currency }}</div>
                @break
            @case('payments')
                <div class="font-medium text-zinc-900 dark:text-zinc-100">Paiement #{{ $row->id }}</div>
                <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ $row->amount }} {{ $row->currency }} · {{ $row->provider }}</div>
                @break
            @case('deliveries')
                <div class="font-medium text-zinc-900">Livraison #{{ $row->id }}</div>
                <div class="text-xs text-zinc-500">{{ $row->company?->name ?? '—' }}</div>
                @break
            @default
                <div class="font-medium text-zinc-900">{{ $row->id ?? '—' }}</div>
        @endswitch
    </td>
    <td class="px-4 py-3">
        @if ($section === 'payments')
            <select wire:change="updatePaymentStatus({{ $row->id }}, $event.target.value)" class="rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                @foreach (\App\Support\PaymentStatusPresenter::values() as $status)
                    <option value="{{ $status }}" @selected($row->status === $status)>{{ \App\Support\PaymentStatusPresenter::label($status) }}</option>
                @endforeach
            </select>
        @elseif ($section === 'subscriptions')
            <select wire:change="updateSubscriptionStatus({{ $row->id }}, $event.target.value)" class="rounded-lg border border-zinc-300 px-2 py-1 text-xs">
                @foreach (['pending', 'scheduled', 'active', 'paused', 'rejected', 'expired', 'cancelled'] as $status)
                    <option value="{{ $status }}" @selected($row->status === $status)>{{ $status }}</option>
                @endforeach
            </select>
        @else
            <span class="rounded-full bg-zinc-100 px-2 py-1 text-xs">{{ $row->status ?? $row->payment_status ?? '—' }}</span>
        @endif
    </td>
    <td class="px-4 py-3">{{ optional($row->created_at)->format('d/m/Y H:i') ?? '—' }}</td>
@endif
