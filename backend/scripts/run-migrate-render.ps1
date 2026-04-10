# Exécute les migrations Laravel sur la base Render (création table notifications, etc.).
# Prérequis : backend/.env.render.db avec une ligne = URL PostgreSQL Render (Internal ou External).
# Usage : .\run-migrate-render.ps1

$backendDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $backendDir ".env.render.db"

if (-not (Test-Path $envFile)) {
    Write-Host "Fichier manquant : backend/.env.render.db" -ForegroundColor Red
    Write-Host "Copie backend/.env.render.db.example en .env.render.db puis colle l'URL PostgreSQL Render (une ligne)." -ForegroundColor Yellow
    exit 1
}

$dbUrl = (Get-Content $envFile -Raw).Trim()
if ([string]::IsNullOrWhiteSpace($dbUrl) -or $dbUrl.StartsWith("#")) {
    Write-Host "Le fichier .env.render.db doit contenir l'URL PostgreSQL (sans # en début de ligne)." -ForegroundColor Red
    exit 1
}

$env:DB_CONNECTION = "pgsql"
$env:DB_URL = $dbUrl
$env:DB_PORT = "5432"

Set-Location $backendDir
Write-Host "Connexion à la base Render, exécution des migrations..." -ForegroundColor Cyan
& php artisan migrate --force
$exitCode = $LASTEXITCODE
Remove-Item Env:\DB_CONNECTION -ErrorAction SilentlyContinue
Remove-Item Env:\DB_URL -ErrorAction SilentlyContinue
Remove-Item Env:\DB_PORT -ErrorAction SilentlyContinue
exit $exitCode
