<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plan de Livraison</title>
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
            font-size: 20px;
        }
        .info-section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .info-section h2 {
            font-size: 14px;
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
            page-break-inside: avoid;
        }
        thead {
            background-color: #333;
            color: white;
        }
        th {
            padding: 8px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 6px;
            border-bottom: 1px solid #ddd;
        }
        tbody tr:nth-child(odd) {
            background-color: #f9f9f9;
        }
        .week-header {
            background-color: #e0e0e0;
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 10px;
            padding: 8px;
        }
        .summary {
            background-color: #f0f8ff;
            padding: 10px;
            border-left: 4px solid #0066cc;
            margin: 10px 0;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>PLAN DE LIVRAISON</h1>
        <p>GREEN EXPRESS - Système de Gestion de Repas Entreprise</p>
    </div>

    <div class="info-section">
        <h2>Informations Entreprise</h2>
        <div class="info-row">
            <span class="info-label">Entreprise:</span>
            <span class="info-value">{{ $company->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Type:</span>
            <span class="info-value">{{ $company->getInstitutionLabel() }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Contact:</span>
            <span class="info-value">{{ $company->contactUser->name ?? 'N/A' }} - {{ $company->email }}</span>
        </div>
    </div>

    <div class="info-section">
        <h2>Informations Abonnement</h2>
        <div class="info-row">
            <span class="info-label">Période:</span>
            <span class="info-value">
                du {{ $subscription->start_date->format('d/m/Y') }} 
                au {{ $subscription->end_date->format('d/m/Y') }}
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">Nombre d'agents:</span>
            <span class="info-value">{{ $subscription->agent_count }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Tarif mensuel:</span>
            <span class="info-value">
                {{ number_format($subscription->total_monthly_price, 2) }} {{ $subscription->currency }}
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">Statut:</span>
            <span class="info-value">{{ $subscription->getStatusLabel() }}</span>
        </div>
    </div>

    <div class="summary">
        <strong>Récapitulatif des Livraisons:</strong>
        <br>Total de repas: {{ $total_meals }} | Livrés: {{ $meals_provided }} | Restants: {{ $meals_remaining }}
        <br>Progression: {{ number_format(($meals_provided / max($total_meals, 1)) * 100, 1) }}%
    </div>

    @foreach($weeks as $week)
    <div class="info-section">
        <div class="week-header">
            Semaine {{ $week['week_number'] }} 
            ({{ $week['start_date'] }} - {{ $week['end_date'] }})
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Fonction</th>
                    <th>Repas</th>
                    <th>Accompagnement</th>
                </tr>
            </thead>
            <tbody>
                @foreach($week['meal_plans'] as $plan)
                <tr>
                    <td>{{ $plan->employee->matricule }}</td>
                    <td>{{ $plan->employee->full_name }}</td>
                    <td>{{ $plan->employee->getFunctionLabel() }}</td>
                    <td>{{ $plan->meal->name }}</td>
                    <td>{{ $plan->side->name }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endforeach

    <div class="footer">
        <p>Document généré le {{ $generated_at }}</p>
        <p>Plan de livraison - Abonnement #{{ $subscription->id }}</p>
    </div>
</body>
</html>
