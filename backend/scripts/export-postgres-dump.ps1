#Requires -Version 5.1
<#
.SYNOPSIS
  Exporte la base PostgreSQL (ex. Render) vers un fichier .sql (texte).

.PARAMETER OutPath
  Fichier de sortie (défaut : backend/backups/gx-db-YYYYMMDD-HHmm.sql).

.PARAMETER EnvPath
  .env à lire (défaut .env.production).

.EXAMPLE
  cd backend
  .\scripts\export-postgres-dump.ps1
#>
param(
    [string] $OutPath = "",
    [string] $EnvPath = ""
)

$ErrorActionPreference = 'Stop'
$backendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $backendRoot

if (-not $EnvPath) { $EnvPath = Join-Path $backendRoot '.env.production' }
if (-not (Test-Path $EnvPath)) { Write-Error "Fichier env introuvable : $EnvPath" }

function Get-DbUrlFromEnvFile {
    param([string] $Path)
    $raw = Get-Content -LiteralPath $Path -Encoding UTF8
    foreach ($line in $raw) {
        $t = $line.Trim()
        if ($t -match '^\s*#' -or $t -eq '') { continue }
        if ($t -match '^(?:DATABASE_URL|DB_URL)\s*=\s*(.+)$') {
            $v = $Matches[1].Trim()
            if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
                $v = $v.Substring(1, $v.Length - 2)
            }
            return $v
        }
    }
    Write-Error "Aucune DATABASE_URL / DB_URL dans $Path"
}

$dbUrl = Get-DbUrlFromEnvFile -Path $EnvPath
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Error "pg_dump introuvable. Installez les outils client PostgreSQL et ajoutez-les au PATH."
}

if (-not $OutPath) {
    $dir = Join-Path $backendRoot 'backups'
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
    $OutPath = Join-Path $dir ("gx-db-{0:yyyyMMdd-HHmm}.sql" -f (Get-Date))
}

Write-Host "Export vers $OutPath ..." -ForegroundColor Cyan
$env:PGSSLMODE = 'require'
& pg_dump --dbname $dbUrl --format=plain --no-owner --no-acl --file $OutPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump a retourné le code $LASTEXITCODE"
}
Write-Host "OK. Conservez ce fichier hors du dépôt Git." -ForegroundColor Green
