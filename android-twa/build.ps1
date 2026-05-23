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
    compile : Compile Gradle uniquement (APK/AAB non signes pour release)
    sign    : Signe les artefacts Gradle (requiert BUBBLEWRAP_* ou .env.local)
    build   : compile + sign (si mots de passe) sinon bubblewrap build interactif
    sha256  : Affiche le SHA256 du keystore (pour assetlinks.json)
    install : Installe app-release-signed.apk sur appareil USB

.EXAMPLE
    .\build.ps1 -Action init
    .\build.ps1 -Action build
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('init','update','compile','sign','build','sha256','install')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $here

function CommandExists($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Resolve-AndroidSdk {
    if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) { return $env:ANDROID_HOME }
    $candidates = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        'C:\Android\Sdk'
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

function Ensure-AndroidSdk([string]$sdkRoot, [int[]]$platformLevels = @(36, 35)) {
    if (-not $sdkRoot) {
        throw "SDK Android introuvable. Installez Android Studio ou definissez ANDROID_HOME."
    }
    $env:ANDROID_HOME = $sdkRoot
    $escaped = $sdkRoot -replace '\\', '\\'
    "sdk.dir=$escaped" | Out-File -FilePath (Join-Path $here 'local.properties') -Encoding ascii -NoNewline
    Add-Content -Path (Join-Path $here 'local.properties') -Value "`n"

    $sdkmgr = Get-ChildItem (Join-Path $sdkRoot 'cmdline-tools') -Recurse -Filter 'sdkmanager.bat' -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
    if (-not $sdkmgr) { return }

    $yes = ("y`n" * 80)
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $null = $yes | & $sdkmgr --licenses 2>&1 | Out-Null
    $ErrorActionPreference = $prevEap

    $missing = @()
    foreach ($level in $platformLevels) {
        if (-not (Test-Path (Join-Path $sdkRoot "platforms\android-$level"))) {
            $missing += "platforms;android-$level"
        }
    }
    if ($missing.Count -gt 0) {
        Write-Host "Installation SDK : $($missing -join ', ')" -ForegroundColor Yellow
        & $sdkmgr @missing 2>&1 | Out-Host
    }
}

function Ensure-Jdk {
    if ($env:JAVA_HOME -and (Test-Path $env:JAVA_HOME)) { return }
    $temurin = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^jdk-(17|21)' } |
        Sort-Object { if ($_.Name -match 'jdk-17') { 0 } else { 1 } } |
        Select-Object -First 1
    if ($temurin) { $env:JAVA_HOME = $temurin.FullName }
}

function Import-EnvLocal {
    $envFile = Join-Path $here '.env.local'
    if (-not (Test-Path $envFile)) { return }
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#')) { return }
        if ($line -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "Variables chargees depuis .env.local" -ForegroundColor DarkGray
}

function Get-LatestBuildTools([string]$sdkRoot) {
    $dir = Join-Path $sdkRoot 'build-tools'
    if (-not (Test-Path $dir)) { throw "build-tools introuvable dans $sdkRoot" }
    return Get-ChildItem $dir -Directory | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
}

function Compile-Gradle {
    Write-Host "Compilation Gradle (assembleRelease + bundleRelease)..." -ForegroundColor Cyan
    & .\gradlew.bat assembleRelease bundleRelease --no-daemon
    if ($LASTEXITCODE -ne 0) { throw "Gradle build a echoue (code $LASTEXITCODE)" }
    $apk = Join-Path $here 'app\build\outputs\apk\release\app-release-unsigned.apk'
    $aab = Join-Path $here 'app\build\outputs\bundle\release\app-release.aab'
    if (-not (Test-Path $apk)) { throw "APK non signe introuvable : $apk" }
    if (-not (Test-Path $aab)) { throw "AAB introuvable : $aab" }
    Write-Host "[OK] Compile : $apk" -ForegroundColor Green
    Write-Host "[OK] Compile : $aab" -ForegroundColor Green
}

function Sign-ReleaseArtifacts {
    Import-EnvLocal
    $storePass = $env:BUBBLEWRAP_KEYSTORE_PASSWORD
    $keyPass = $env:BUBBLEWRAP_KEY_PASSWORD
    if (-not $storePass -or -not $keyPass) {
        throw "Definissez BUBBLEWRAP_KEYSTORE_PASSWORD et BUBBLEWRAP_KEY_PASSWORD (ou .env.local)."
    }

    $manifest = Get-Content (Join-Path $here 'twa-manifest.json') -Raw | ConvertFrom-Json
    $keystore = $manifest.signingKey.path
    $alias = $manifest.signingKey.alias
    if (-not $alias) { $alias = 'android' }
    if (-not (Test-Path $keystore)) { $keystore = Join-Path $here 'android.keystore' }

    $sdk = Resolve-AndroidSdk
    Ensure-AndroidSdk $sdk
    $tools = Get-LatestBuildTools $env:ANDROID_HOME

    $apkIn = Join-Path $here 'app\build\outputs\apk\release\app-release-unsigned.apk'
    $aabIn = Join-Path $here 'app\build\outputs\bundle\release\app-release.aab'
    $apkAligned = Join-Path $here 'app-release-unsigned-aligned.apk'
    $apkOut = Join-Path $here 'app-release-signed.apk'
    $aabOut = Join-Path $here 'app-release-bundle.aab'

    if (-not (Test-Path $apkIn)) { throw "Lancez d'abord -Action compile. APK manquant : $apkIn" }
    if (-not (Test-Path $aabIn)) { throw "Lancez d'abord -Action compile. AAB manquant : $aabIn" }

    $zipalign = Join-Path $tools.FullName 'zipalign.exe'
    $apksigner = Join-Path $tools.FullName 'apksigner.bat'
    $jarsigner = Join-Path $env:JAVA_HOME 'bin\jarsigner.exe'

    Write-Host "Signature APK (zipalign + apksigner)..." -ForegroundColor Cyan
    & $zipalign -f -v 4 $apkIn $apkAligned
    if ($LASTEXITCODE -ne 0) { throw "zipalign a echoue" }
    & $apksigner sign --ks $keystore --ks-key-alias $alias `
        --ks-pass "pass:$storePass" --key-pass "pass:$keyPass" `
        --out $apkOut $apkAligned
    if ($LASTEXITCODE -ne 0) { throw "apksigner a echoue" }
    & $apksigner verify --verbose $apkOut | Out-Host

    Write-Host "Signature AAB (jarsigner)..." -ForegroundColor Cyan
    Copy-Item $aabIn $aabOut -Force
    & $jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 `
        -keystore $keystore -storepass $storePass -keypass $keyPass `
        $aabOut $alias
    if ($LASTEXITCODE -ne 0) { throw "jarsigner a echoue" }

    Write-Host ""
    Write-Host "[OK] APK signe : $apkOut" -ForegroundColor Green
    Write-Host "[OK] AAB signe : $aabOut" -ForegroundColor Green
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

    'compile' {
        Ensure-Jdk
        Ensure-AndroidSdk (Resolve-AndroidSdk)
        Compile-Gradle
    }

    'sign' {
        Ensure-Jdk
        Sign-ReleaseArtifacts
    }

    'build' {
        if (-not (Test-Path 'twa-manifest.json')) { throw "twa-manifest.json absent." }
        Import-EnvLocal
        Ensure-Jdk
        Ensure-AndroidSdk (Resolve-AndroidSdk)
        if ($env:BUBBLEWRAP_KEYSTORE_PASSWORD -and $env:BUBBLEWRAP_KEY_PASSWORD) {
            Compile-Gradle
            Sign-ReleaseArtifacts
        } else {
            Write-Host "Mots de passe absents : bubblewrap build (saisie interactive)..." -ForegroundColor Yellow
            Write-Host "Astuce : copiez .env.example vers .env.local pour automatiser." -ForegroundColor Yellow
            $bw = Join-Path $env:APPDATA 'npm\bubblewrap.ps1'
            if (-not (Test-Path $bw)) { $bw = "bubblewrap" }
            & $bw build
            if ($LASTEXITCODE -ne 0) { throw "bubblewrap build a echoue" }
        }
        Write-Host ""
        Write-Host "[OK] Build termine." -ForegroundColor Green
        Write-Host "     - app-release-signed.apk"
        Write-Host "     - app-release-bundle.aab"
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
        $sdk = Resolve-AndroidSdk
        if ($sdk) {
            $adb = Join-Path $sdk 'platform-tools\adb.exe'
            if (Test-Path $adb) { $env:Path = "$(Split-Path $adb -Parent);$env:Path" }
        }
        if (-not (CommandExists adb)) { throw "adb requis (Android SDK Platform-Tools)." }
        Write-Host "Installation sur appareil USB..." -ForegroundColor Cyan
        adb install -r $apk
        Write-Host "[OK] Installe." -ForegroundColor Green
    }
}

