<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Liste des agents - {{ $company->name }}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 20px; }
        .info-section { margin-bottom: 15px; }
        .info-row { margin-bottom: 4px; }
        .info-label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        thead { background-color: #333; color: white; }
        th { padding: 8px; text-align: left; font-weight: bold; }
        td { padding: 6px; border-bottom: 1px solid #ddd; }
        tbody tr:nth-child(odd) { background-color: #f9f9f9; }
        .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LISTE DES AGENTS À SERVIR</h1>
        <p>GREEN EXPRESS — Document pour livreurs</p>
    </div>

    <div class="info-section">
        <div class="info-row"><span class="info-label">Entreprise :</span> {{ $company->name }}</div>
        <div class="info-row"><span class="info-label">Adresse :</span> {{ $company->address ?? '—' }}</div>
        <div class="info-row"><span class="info-label">Téléphone :</span> {{ $company->phone ?? '—' }}</div>
        <div class="info-row"><span class="info-label">Nombre d'agents :</span> {{ $employees->count() }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Matricule</th>
                <th>Nom complet</th>
                <th>Fonction</th>
                <th>Téléphone</th>
                <th>Email</th>
            </tr>
        </thead>
        <tbody>
            @foreach($employees as $index => $emp)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $emp->matricule ?? '—' }}</td>
                <td>{{ $emp->full_name }}</td>
                <td>{{ $emp->function ?? '—' }}</td>
                <td>{{ $emp->phone ?? '—' }}</td>
                <td>{{ $emp->email ?? '—' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Document généré le {{ $generated_at }}</p>
        <p>Entreprise #{{ $company->id }} — Liste des agents pour livraison</p>
    </div>
</body>
</html>
