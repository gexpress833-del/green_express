@php
    $currency = 'CDF';
    if ($order->items && $order->items->isNotEmpty() && $order->items->first()->menu) {
        $currency = $order->items->first()->menu->currency ?? 'CDF';
    }
    $currencyLabel = $currency === 'CDF' ? 'CDF' : $currency;
    $statusLabels = [
        'pending_payment' => 'En attente paiement',
        'pending' => 'En cours',
        'paid' => 'Payée',
        'out_for_delivery' => 'En livraison',
        'delivered' => 'Livrée',
        'cancelled' => 'Annulée',
    ];
    $statusLabel = $statusLabels[$order->status] ?? $order->status;
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Commande #{{ $order->id }}</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; margin: 0; padding: 24px; font-size: 11px; color: #1e293b; }
        .header { margin-bottom: 20px; border-bottom: 3px solid #0f172a; padding-bottom: 12px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 16px 20px; margin: -24px -24px 20px -24px; }
        .header h1 { margin: 0; font-size: 20px; color: #0f172a; }
        .meta { color: #475569; font-size: 10px; margin-top: 6px; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; }
        .status-pending_payment { background: #fef3c7; color: #92400e; }
        .status-pending { background: #dbeafe; color: #1e40af; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-delivered { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .status-out_for_delivery { background: #e0e7ff; color: #3730a3; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
        th { background: #0f172a; color: #fff; font-weight: bold; font-size: 11px; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr:nth-child(odd) { background: #fff; }
        .total-row { background: #e2e8f0 !important; font-weight: bold; font-size: 12px; border-top: 2px solid #0f172a; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b; }
        .info-block { margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .info-block strong { color: #334155; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Commande #{{ $order->id }}</h1>
        <div class="meta">Green Express — {{ $order->created_at?->format('d/m/Y H:i') }} — Statut : <span class="status-badge status-{{ $order->status }}">{{ $statusLabel }}</span></div>
    </div>
    <div class="info-block"><strong>Client :</strong> {{ $order->user?->name ?? $order->user?->email ?? '—' }}</div>
    @if($order->delivery_address)
    <div class="info-block"><strong>Adresse de livraison :</strong> {{ $order->delivery_address }}</div>
    @endif
    @if($order->delivery_code)
    <div class="info-block"><strong>Code livraison :</strong> {{ $order->delivery_code }}</div>
    @endif
    <table>
        <thead>
            <tr>
                <th>Article</th>
                <th>Quantité</th>
                <th>Prix unit.</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items ?? [] as $item)
            @php $itemCurrency = $item->menu?->currency ?? $currency; $itemLabel = $itemCurrency === 'CDF' ? 'CDF' : $itemCurrency; @endphp
            <tr>
                <td>{{ $item->menu?->name ?? 'Menu #' . $item->menu_id }}</td>
                <td>{{ $item->quantity }}</td>
                <td>{{ number_format((float)($item->price ?? 0), 2, ',', ' ') }} {{ $itemLabel }}</td>
                <td>{{ number_format((float)($item->price ?? 0) * (int)($item->quantity ?? 0), 2, ',', ' ') }} {{ $itemLabel }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <p class="total-row" style="margin:0;padding:10px 12px;border:1px solid #cbd5e1;border-top-width:2px;">Total commande : {{ number_format((float) $order->total_amount, 2, ',', ' ') }} {{ $currencyLabel }}</p>
    <div class="footer">Document généré automatiquement. © {{ date('Y') }} Green Express.</div>
</body>
</html>
