<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Résumé des Repas</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
        }
        .info-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        .info-section h2 {
            font-size: 13px;
            background-color: #f0f0f0;
            padding: 8px;
            margin: 0 0 10px 0;
        }
        .info-row {
            display: flex;
            margin-bottom: 5px;
        }
        .info-label {
            font-weight: bold;
            width: 150px;
        }
        .info-value {
            flex: 1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        thead {
            background-color: #333;
            color: white;
        }
        th {
            padding: 8px;
            text-align: left;
        }
        td {
            padding: 6px;
            border-bottom: 1px solid #ddd;
        }
        .summary {
            background-color: #f0f8ff;
            padding: 10px;
            border-left: 4px solid #0066cc;
            margin: 10px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
        }
        .status-delivered {
            background-color: #4caf50;
            color: white;
        }
        .status-pending {
            background-color: #ff9800;
            color: white;
        }
        .status-failed {
            background-color: #f44336;
            color: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>RÉSUMÉ DES REPAS</h1>
        <p>GREEN EXPRESS - Suivi Individuel</p>
    </div>

    <div class="info-section">
        <h2>Informations Personnelles</h2>
        <div class="info-row">
            <span class="info-label">Nom:</span>
            <span class="info-value">{{ $employee->full_name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Matricule:</span>
            <span class="info-value">{{ $employee->matricule }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Fonction:</span>
            <span class="info-value">{{ $employee->getFunctionLabel() }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">{{ $employee->email }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Entreprise:</span>
            <span class="info-value">{{ $company->name }}</span>
        </div>
    </div>

    <div class="info-section">
        <h2>Plan Repas</h2>
        <div class="info-row">
            <span class="info-label">Repas Choisi:</span>
            <span class="info-value">{{ $meal_plan->meal->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Accompagnement:</span>
            <span class="info-value">{{ $meal_plan->side->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Période:</span>
            <span class="info-value">
                du {{ $meal_plan->valid_from->format('d/m/Y') }} 
                au {{ $meal_plan->valid_until->format('d/m/Y') }}
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">Statut:</span>
            <span class="info-value">{{ $meal_plan->getStatusLabel() }}</span>
        </div>
    </div>

    <div class="summary">
        <strong>Statut de Livraison:</strong>
        <br>Repas livrés: <span class="status-badge status-delivered">{{ $meal_plan->meals_delivered }}/20</span>
        <br>Repas restants: {{ $meal_plan->meals_remaining }}
        <br>Progression: {{ $meal_plan->getProgressPercentage() }}%
    </div>

    <div class="info-section">
        <h2>Repas Livrés</h2>
        @if($delivered_dates->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Jour</th>
                    <th>Statut</th>
                    <th>Livré le</th>
                </tr>
            </thead>
            <tbody>
                @foreach($delivered_dates as $log)
                <tr>
                    <td>{{ $log->delivery_date->format('d/m/Y') }}</td>
                    <td>{{ $log->getDayLabel() }}</td>
                    <td><span class="status-badge status-delivered">{{ $log->getStatusLabel() }}</span></td>
                    <td>{{ $log->delivered_at ? $log->delivered_at->format('d/m/Y H:i') : 'N/A' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <p style="color: #666;">Aucun repas livré pour le moment.</p>
        @endif
    </div>

    @if($pending_dates->count() > 0)
    <div class="info-section">
        <h2>Repas en Attente</h2>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Jour</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                @foreach($pending_dates as $log)
                <tr>
                    <td>{{ $log->delivery_date->format('d/m/Y') }}</td>
                    <td>{{ $log->getDayLabel() }}</td>
                    <td><span class="status-badge status-pending">{{ $log->getStatusLabel() }}</span></td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
</body>
</html>
