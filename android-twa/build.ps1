<#
.SYNOPSIS
    Build / mise a jour du TWA Android (Trusted Web Activity) Green Express.

.DESCRIPTION
    Ce script automatise les etapes Bubblewrap :
        - verifie les pre-requis (Node, JDK)
        - installe Bubblewrap si absent
        - initialise le projet TWA depuis twa-manifest.json (1ere fois)
        - met a jour si deja initialise
        - build l'APK + AAB signes
        - imprime le SHA256 a coller dans assetlinks.json

.PARAMETER Action
    init    : 1ere initialisation du projet (genere keystore + projet Android)
    update  : Met a jour le projet a partir du twa-manifest.json modifie
    build   : Compile APK + AAB
    sha256  : Affiche le SHA256 du keystore (pour assetlinks.json)
    install : Installe l'APK debug sur un appareil branche en USB (debug)

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

function CommandExists($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# --- Pre-requis ---
if (-not (CommandExists node))   { throw "Node.js requis (>=18). https://nodejs.org" }
if (-not (CommandExists java))   { throw "JDK requis (17+). Installer Eclipse Temurin 17 : https://adoptium.net" }
if (-not (CommandExists npx))    { throw "npx introuvable (devrait etre inclus avec Node)." }

if (-not (CommandExists bubblewrap)) {
    Write-Host "Bubblewrap CLI absent -- installation globale..." -ForegroundColor Yellow
    npm install -g @bubblewrap/cli
}

switch ($Action) {

    'init' {
        if (Test-Path 'app' -PathType Container) {
            Write-Host "Projet deja initialise. Utilisez -Action update." -ForegroundColor Yellow
            return
        }
        Write-Host "Initialisation TWA depuis https://green-express-iota.vercel.app/manifest.webmanifest ..." -ForegroundColor Cyan
        Write-Host "(Repondez aux questions interactives de Bubblewrap ci-dessous)" -ForegroundColor Yellow
        $bw = Join-Path $env:APPDATA 'npm\bubblewrap.ps1'
        if (-not (Test-Path $bw)) { $bw = "bubblewrap" }
        & $bw init --manifest "https://green-express-iota.vercel.app/manifest.webmanifest"
        if ($LASTEXITCODE -ne 0) { throw "bubblewrap init a echoue (code $LASTEXITCODE)" }
        Write-Host ""
        Write-Host "[OK] Projet initialise." -ForegroundColor Green
        Write-Host "   Etape suivante :" -ForegroundColor Cyan
        Write-Host "   1) .\build.ps1 -Action sha256   # recupere le SHA256"
        Write-Host "   2) Coller le SHA256 dans frontend-next/public/.well-known/assetlinks.json"
        Write-Host "   3) Deployer le frontend (Vercel)"
        Write-Host "   4) .\build.ps1 -Action build    # APK + AAB"
    }

    'update' {
        Write-Host "Mise a jour du projet a partir de twa-manifest.json..." -ForegroundColor Cyan
        $bw = Join-Path $env:APPDATA 'npm\bubblewrap.ps1'
        if (-not (Test-Path $bw)) { $bw = "bubblewrap" }
        & $bw update --manifest "$here\twa-manifest.json"
        Write-Host "[OK] Projet mis a jour. Lancez ensuite : .\build.ps1 -Action build" -ForegroundColor Green
    }

    'build' {
        if (-not (Test-Path 'twa-manifest.json')) { throw "twa-manifest.json absent." }
        Write-Host "Build APK + AAB signes..." -ForegroundColor Cyan
        $bw = Join-Path $env:APPDATA 'npm\bubblewrap.ps1'
        if (-not (Test-Path $bw)) { $bw = "bubblewrap" }
        & $bw build
        Write-Host ""
        Write-Host "[OK] Build termine." -ForegroundColor Green
        Write-Host "   Fichiers generes :"
        Write-Host "     - app-release-signed.apk  (test direct sur appareil)"
        Write-Host "     - app-release-bundle.aab  (upload Google Play Store)"
    }

    'sha256' {
        $keystore = Join-Path $here 'android.keystore'
        if (-not (Test-Path $keystore)) {
            throw "android.keystore introuvable. Lancez d'abord -Action init."
        }
        Write-Host "Affichage du SHA256 du keystore (a coller dans assetlinks.json)..." -ForegroundColor Cyan
        Write-Host ""
        $alias = Read-Host "Alias du keystore (par defaut : android)"
        if (-not $alias) { $alias = 'android' }
        $pwd = Read-Host "Mot de passe du keystore" -AsSecureString
        $pwdPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwd)
        )
        & keytool -list -v -keystore $keystore -alias $alias -storepass $pwdPlain |
            Select-String -Pattern 'SHA256:' |
            ForEach-Object { Write-Host $_.Line.Trim() -ForegroundColor Green }
        Write-Host ""
        Write-Host "Copiez la valeur apres 'SHA256:' (avec les ':' entre les octets)."
        Write-Host "Collez-la dans frontend-next/public/.well-known/assetlinks.json"
        Write-Host "remplacant la chaine 'REPLACE_WITH_SHA256_OF_RELEASE_KEYSTORE'."
    }

    'install' {
        $apk = Join-Path $here 'app-release-signed.apk'
        if (-not (Test-Path $apk)) { throw "APK introuvable. Lancez d'abord -Action build." }
        if (-not (CommandExists adb)) { throw "adb requis (Android SDK Platform-Tools)." }
        Write-Host "Installation sur appareil USB..." -ForegroundColor Cyan
        adb install -r $apk
        Write-Host "[OK] Installe." -ForegroundColor Green
    }
}

