#Requires -Version 5.1
<#
.SYNOPSIS
  Restaure une base PostgreSQL (ex. Render) à partir d'un fichier .sql (texte) ou .dump (format custom pg_dump).

.DESCRIPTION
  Lit DATABASE_URL ou DB_URL dans backend/.env.production (ou .env si -EnvPath).
  Nécessite les outils clients PostgreSQL : psql (fichier .sql) et pg_restore (fichier .dump / .backup custom).

  ATTENTION : un dump complet écrase en général les données actuelles. Faire un export de secours avant.

.PARAMETER DumpPath
  Chemin vers le fichier (.sql, .dump, .backup).

.PARAMETER EnvPath
  Fichier .env à utiliser (défaut : .env.production à côté du backend).

.PARAMETER Force
  Ne pas demander confirmation.

.EXAMPLE
  cd backend
  .\scripts\restore-postgres-from-dump.ps1 -DumpPath "C:\Backups\db_greenexpress_2026-01-01.sql"

.EXAMPLE
  .\scripts\restore-postgres-from-dump.ps1 -DumpPath ".\backups\prod.dump" -EnvPath ".env"
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [string] $DumpPath,

    [string] $EnvPath = "",

    [switch] $Force
)

$ErrorActionPreference = 'Stop'
$backendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $backendRoot

if (-not $EnvPath) {
    $EnvPath = Join-Path $backendRoot '.env.production'
}
if (-not (Test-Path $EnvPath)) {
    Write-Error "Fichier env introuvable : $EnvPath (utilisez -EnvPath ou créez .env.production)."
}

$DumpPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($DumpPath)
if (-not (Test-Path $DumpPath)) {
    Write-Error "Fichier dump introuvable : $DumpPath"
}

function Get-DbUrlFromEnvFile {
    param([string] $Path)
    $raw = Get-Content -LiteralPath $Path -Encoding UTF8
    $url = $null
    foreach ($line in $raw) {
        $t = $line.Trim()
        if ($t -match '^\s*#' -or $t -eq '') { continue }
        if ($t -match '^(?:DATABASE_URL|DB_URL)\s*=\s*(.+)$') {
            $v = $Matches[1].Trim()
            if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
                $v = $v.Substring(1, $v.Length - 2)
            }
            $url = $v
            break
        }
    }
    if (-not $url) {
        Write-Error "Aucune DATABASE_URL ni DB_URL trouvée dans $Path"
    }
    return $url
}

$dbUrl = Get-DbUrlFromEnvFile -Path $EnvPath
$masked = $dbUrl -replace '(://[^:]+:)([^@]+)(@)', '$1***$3'
Write-Host "Cible (mot de passe masqué) : $masked" -ForegroundColor Cyan
Write-Host "Fichier : $DumpPath" -ForegroundColor Cyan

$ext = [System.IO.Path]::GetExtension($DumpPath).ToLowerInvariant()
$useSql = $ext -eq '.sql'

$psql = Get-Command psql -ErrorAction SilentlyContinue
$pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue

if ($useSql) {
    if (-not $psql) {
        Write-Error "psql introuvable dans le PATH. Installez PostgreSQL client (ex. choco install postgresql --params `"/Password:postgres`") ou ajoutez le dossier bin au PATH."
    }
} else {
    if (-not $pgRestore) {
        Write-Error "pg_restore introuvable dans le PATH (dump binaire custom). Installez les outils PostgreSQL client, ou exportez en .sql avec pg_dump -Fp."
    }
}

if (-not $Force) {
    $msg = "Restaurer ce dump sur la base ci-dessus ? Les données existantes peuvent être remplacées. (o/N)"
    $r = Read-Host $msg
    if ($r -notmatch '^[oOyY]') {
        Write-Host "Annulé."
        exit 0
    }
}

if ($useSql) {
    Write-Host "Exécution psql -f ..." -ForegroundColor Yellow
    $env:PGSSLMODE = 'require'
    & psql --variable ON_ERROR_STOP=1 --dbname $dbUrl -f $DumpPath
    if ($LASTEXITCODE -ne 0) {
        Write-Error "psql a retourné le code $LASTEXITCODE"
    }
} else {
    Write-Host "Exécution pg_restore ..." -ForegroundColor Yellow
    $env:PGSSLMODE = 'require'
    # --clean supprime objets avant recréation (souvent voulu pour restauration complète)
    & pg_restore --verbose --clean --if-exists --no-owner --no-acl --dbname $dbUrl $DumpPath
    if ($LASTEXITCODE -gt 1) {
        Write-Error "pg_restore a retourné le code $LASTEXITCODE"
    }
}

Write-Host "Terminé. Vérifiez avec : php artisan gx:production-health" -ForegroundColor Green
