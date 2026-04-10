# Crée les comptes (admin, cuisinier, livreur, verificateur, client, entreprise) dans la base Render.
# Prérequis : avoir créé backend/.env.render.db avec une seule ligne = l'Internal Database URL Render.
# Usage : .\run-production-users.ps1
#        .\run-production-users.ps1 -Password "TonMotDePasse"

param([string]$Password = "")

$backendDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $backendDir ".env.render.db"

if (-not (Test-Path $envFile)) {
    Write-Host "Fichier manquant : backend/.env.render.db" -ForegroundColor Red
    Write-Host "Copie backend/.env.render.db.example en .env.render.db puis colle l'Internal Database URL de Render (une ligne)." -ForegroundColor Yellow
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
Write-Host "Connexion à la base Render, création des comptes..." -ForegroundColor Cyan
$args = @("artisan", "create:production-users", "--domain=greenexpress.com")
if ($Password) { $args += "--password=$Password" }
& php @args
$exitCode = $LASTEXITCODE
Remove-Item Env:\DB_CONNECTION -ErrorAction SilentlyContinue
Remove-Item Env:\DB_URL -ErrorAction SilentlyContinue
Remove-Item Env:\DB_PORT -ErrorAction SilentlyContinue
exit $exitCode
