#Requires -Version 5.1
<#
.SYNOPSIS
    Déploie le backend Green Express sur Render via l'API.

.DESCRIPTION
    Utilise la Render API Key pour déclencher un nouveau build du service web.
    La clé doit être définie dans l'environnement : $env:RENDER_API_KEY

.EXAMPLE
    $env:RENDER_API_KEY = "rnd_OwVVG5xnwnzyD93IOu6DGTxmtiPV"
    .\scripts\deploy-render.ps1
#>

param(
    [string]$ApiKey = $env:RENDER_API_KEY,
    [string]$ServiceId = "srv-greenexpress-api",
    [string]$Branch = "main"
)

if (-not $ApiKey) {
    Write-Error "RENDER_API_KEY non défini. Définissez la variable d'environnement ou passez -ApiKey."
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Accept"        = "application/json"
}

Write-Host "Déclenchement du déploiement Render pour le service $ServiceId..." -ForegroundColor Cyan

try {
    # Option 1 : déclencher un deploy via l'API Render
    $response = Invoke-RestMethod `
        -Uri "https://api.render.com/v1/services/$ServiceId/deploys" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -Body (@{ clearCache = "do_not_clear" } | ConvertTo-Json)

    Write-Host "Déploiement déclenché avec succès !" -ForegroundColor Green
    Write-Host "Deploy ID : $($response.id)" -ForegroundColor Yellow
    Write-Host "Status    : $($response.status)" -ForegroundColor Yellow
} catch {
    Write-Error "Échec du déploiement : $_"
    exit 1
}
