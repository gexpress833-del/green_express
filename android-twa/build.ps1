<#
.SYNOPSIS
    Build / mise à jour du TWA Android (Trusted Web Activity) Green Express.

.DESCRIPTION
    Ce script automatise les étapes Bubblewrap :
        - vérifie les pré-requis (Node, JDK)
        - installe Bubblewrap si absent
        - initialise le projet TWA depuis twa-manifest.json (1ère fois)
        - met à jour si déjà initialisé
        - build l'APK + AAB signés
        - imprime le SHA256 à coller dans assetlinks.json

.PARAMETER Action
    init    : 1ère initialisation du projet (génère keystore + projet Android)
    update  : Met à jour le projet à partir du twa-manifest.json modifié
    build   : Compile APK + AAB
    sha256  : Affiche le SHA256 du keystore (pour assetlinks.json)
    install : Installe l'APK debug sur un appareil branché en USB (debug)

.EXAMPLE
    .\build.ps1 -Action init
    .\build.ps1 -Action build
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('init','update','build','sha256','install')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $here

function Test-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# --- Pré-requis ---
if (-not (Test-Command node))   { throw "Node.js requis (>=18). https://nodejs.org" }
if (-not (Test-Command java))   { throw "JDK requis (17+). Installer Eclipse Temurin 17 : https://adoptium.net" }
if (-not (Test-Command npx))    { throw "npx introuvable (devrait être inclus avec Node)." }

if (-not (Test-Command bubblewrap)) {
    Write-Host "Bubblewrap CLI absent — installation globale..." -ForegroundColor Yellow
    npm install -g @bubblewrap/cli
}

switch ($Action) {

    'init' {
        if (Test-Path 'twa-manifest.json' -PathType Leaf) {
            if (Test-Path 'app' -PathType Container) {
                Write-Host "Projet déjà initialisé. Utilisez -Action update." -ForegroundColor Yellow
                return
            }
            Write-Host "Initialisation TWA depuis twa-manifest.json..." -ForegroundColor Cyan
            bubblewrap init --manifest "$here\twa-manifest.json"
            Write-Host ""
            Write-Host "✅ Projet initialisé." -ForegroundColor Green
            Write-Host "   Étape suivante :" -ForegroundColor Cyan
            Write-Host "   1) .\build.ps1 -Action sha256   # récupère le SHA256"
            Write-Host "   2) Coller le SHA256 dans frontend-next/public/.well-known/assetlinks.json"
            Write-Host "   3) Déployer le frontend (Vercel)"
            Write-Host "   4) .\build.ps1 -Action build    # APK + AAB"
        } else {
            throw "twa-manifest.json introuvable dans $here"
        }
    }

    'update' {
        Write-Host "Mise à jour du projet à partir de twa-manifest.json..." -ForegroundColor Cyan
        bubblewrap update --manifest "$here\twa-manifest.json"
        Write-Host "✅ Projet mis à jour. Lancez ensuite : .\build.ps1 -Action build" -ForegroundColor Green
    }

    'build' {
        if (-not (Test-Path 'twa-manifest.json')) { throw "twa-manifest.json absent." }
        Write-Host "Build APK + AAB signés..." -ForegroundColor Cyan
        bubblewrap build
        Write-Host ""
        Write-Host "✅ Build terminé." -ForegroundColor Green
        Write-Host "   Fichiers générés :"
        Write-Host "     - app-release-signed.apk  (test direct sur appareil)"
        Write-Host "     - app-release-bundle.aab  (upload Google Play Store)"
    }

    'sha256' {
        $keystore = Join-Path $here 'android.keystore'
        if (-not (Test-Path $keystore)) {
            throw "android.keystore introuvable. Lancez d'abord -Action init."
        }
        Write-Host "Affichage du SHA256 du keystore (à coller dans assetlinks.json)..." -ForegroundColor Cyan
        Write-Host ""
        $alias = Read-Host "Alias du keystore (par défaut : android)"
        if (-not $alias) { $alias = 'android' }
        $pwd = Read-Host "Mot de passe du keystore" -AsSecureString
        $pwdPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwd)
        )
        & keytool -list -v -keystore $keystore -alias $alias -storepass $pwdPlain |
            Select-String -Pattern 'SHA256:' |
            ForEach-Object { Write-Host $_.Line.Trim() -ForegroundColor Green }
        Write-Host ""
        Write-Host "Copiez la valeur après 'SHA256:' (avec les ':' entre les octets)."
        Write-Host "Collez-la dans frontend-next/public/.well-known/assetlinks.json"
        Write-Host "remplaçant la chaîne 'REPLACE_WITH_SHA256_OF_RELEASE_KEYSTORE'."
    }

    'install' {
        $apk = Join-Path $here 'app-release-signed.apk'
        if (-not (Test-Path $apk)) { throw "APK introuvable. Lancez d'abord -Action build." }
        if (-not (Test-Command adb)) { throw "adb requis (Android SDK Platform-Tools)." }
        Write-Host "Installation sur appareil USB..." -ForegroundColor Cyan
        adb install -r $apk
        Write-Host "✅ Installé." -ForegroundColor Green
    }
}
