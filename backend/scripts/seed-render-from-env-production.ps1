# Seed Render PostgreSQL using .env.production; restore local .env after.
$ErrorActionPreference = 'Stop'
$backend = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $backend
if (-not (Test-Path '.env.production')) { Write-Error "Missing .env.production" }
$bak = Join-Path $env:TEMP ('gx-env-seed-' + [guid]::NewGuid().ToString() + '.env')
if (Test-Path '.env') { Copy-Item '.env' $bak -Force }
try {
    Copy-Item '.env.production' '.env' -Force
    php artisan config:clear
    php artisan migrate --force
    php artisan db:seed --class=RenderProductionSeeder --force
} finally {
    if (Test-Path $bak) {
        Copy-Item $bak '.env' -Force
        Remove-Item $bak -Force
    }
    php artisan config:clear
}
