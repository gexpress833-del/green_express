<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Commande #{{ $order->id }}</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; margin: 0; padding: 20px; font-size: 11px; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 18px; }
        .meta { color: #666; font-size: 10px; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .total { font-weight: bold; margin-top: 10px; }
        .footer { margin-top: 20px; font-size: 9px; color: #888; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Commande #{{ $order->id }}</h1>
        <div class="meta">Green Express — {{ $order->created_at?->format('d/m/Y H:i') }} — Statut : {{ $order->status }}</div>
    </div>
    <p><strong>Client :</strong> {{ $order->user?->name ?? $order->user?->email ?? '—' }}</p>
    @if($order->delivery_address)
    <p><strong>Adresse de livraison :</strong> {{ $order->delivery_address }}</p>
    @endif
    @if($order->delivery_code)
    <p><strong>Code livraison :</strong> {{ $order->delivery_code }}</p>
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
            <tr>
                <td>{{ $item->menu?->name ?? 'Menu #' . $item->menu_id }}</td>
                <td>{{ $item->quantity }}</td>
                <td>{{ number_format((float)($item->price ?? 0), 2, ',', ' ') }} {{ $item->menu?->currency ?? 'USD' }}</td>
                <td>{{ number_format((float)($item->price ?? 0) * (int)($item->quantity ?? 0), 2, ',', ' ') }} {{ $item->menu?->currency ?? 'USD' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <p class="total">Total commande : {{ number_format((float) $order->total_amount, 2, ',', ' ') }} USD</p>
    <div class="footer">Document généré automatiquement. © {{ date('Y') }} Green Express.</div>
</body>
</html>
