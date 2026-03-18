<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'Rapport' }}</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; margin: 0; padding: 22px; font-size: 10.5px; color: #0f172a; }
        .page { width: 100%; }

        .header {
            text-align: center;
            margin-bottom: 18px;
            border-top: 6px solid #00ffff;
            border-bottom: 2px solid #d4af37;
            padding: 14px 18px 10px;
            background: #f8fafc;
        }
        .header h1 { margin: 0; font-size: 20px; letter-spacing: 0.2px; color: #0b1220; }
        .meta {
            color: #64748b;
            font-size: 10px;
            margin-top: 6px;
        }
        .submeta {
            margin-top: 2px;
            font-size: 9.5px;
            color: #94a3b8;
        }

        .table-wrap { margin-top: 14px; }
        table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; vertical-align: top; }
        th {
            background: #0b1220;
            color: #ffffff;
            font-weight: 700;
            font-size: 10.5px;
        }
        tbody tr:nth-child(odd) { background: #ffffff; }
        tbody tr:nth-child(even) { background: #f1f5f9; }

        .footer {
            margin-top: 22px;
            font-size: 9px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            text-align: center;
        }

        .empty {
            border: 1px dashed #cbd5e1;
            background: #ffffff;
            padding: 16px;
            margin-top: 12px;
            text-align: center;
            color: #64748b;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <h1>{{ $title ?? 'Rapport' }}</h1>
            <div class="meta">Généré le {{ $generatedAt ?? now()->format('d/m/Y H:i') }}</div>
            <div class="submeta">Green Express — Exports administratifs</div>
        </div>

        @if(!empty($rows))
            <div class="table-wrap">
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
            </div>
        @else
            <div class="empty">Aucune donnée pour cette période.</div>
        @endif

        <div class="footer">Document généré automatiquement. © {{ date('Y') }} Green Express.</div>
    </div>
</body>
</html>
