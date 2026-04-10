<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Statistiques admin</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; margin: 0; padding: 20px; font-size: 11px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 18px; }
        .meta { color: #666; font-size: 10px; margin-top: 5px; }
        table { width: 100%; max-width: 400px; margin: 20px auto; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; width: 60%; }
        .footer { margin-top: 25px; font-size: 9px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Statistiques admin — Green Express</h1>
        <div class="meta">Généré le {{ $generatedAt }} — Vue d'ensemble des indicateurs</div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Indicateur</th>
                <th>Valeur</th>
            </tr>
        </thead>
        <tbody>
            @foreach($stats ?? [] as $row)
            <tr>
                <td>{{ $row[0] }}</td>
                <td>{{ $row[1] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <div class="footer">Document généré automatiquement. © {{ date('Y') }} Green Express.</div>
</body>
</html>
