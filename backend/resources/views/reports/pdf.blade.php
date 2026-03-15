<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'Rapport' }}</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; margin: 0; padding: 20px; font-size: 11px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 18px; }
        .meta { color: #666; font-size: 10px; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 9px; color: #888; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title ?? 'Rapport' }}</h1>
        <div class="meta">Généré le {{ $generatedAt ?? now()->format('d/m/Y H:i') }} — Green Express</div>
    </div>
    @if(!empty($rows))
        <table>
            <thead>
                <tr>
                    @foreach($headers ?? [] as $h)
                        <th>{{ $h }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $row)
                    <tr>
                        @foreach($row as $cell)
                            <td>{{ $cell }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p>Aucune donnée pour cette période.</p>
    @endif
    <div class="footer">Document généré automatiquement. © {{ date('Y') }} Green Express.</div>
</body>
</html>
