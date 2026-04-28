param()

$ErrorActionPreference = 'Stop'

$backendEnv  = 'C:\SERVICE\backend\.env'
$frontendEnv = 'C:\SERVICE\frontend-next\.env.local'

if (-not (Test-Path $backendEnv)) {
    throw "Backend .env introuvable: $backendEnv"
}

# 1) backend/.env : BROADCAST_CONNECTION=reverb
$content = Get-Content -Raw -Path $backendEnv
if ($content -match '(?m)^BROADCAST_CONNECTION=.*$') {
    $content = [regex]::Replace($content, '(?m)^BROADCAST_CONNECTION=.*$', 'BROADCAST_CONNECTION=reverb')
} else {
    $content = $content.TrimEnd("`r","`n") + "`r`nBROADCAST_CONNECTION=reverb`r`n"
}
Set-Content -NoNewline -Path $backendEnv -Value $content -Encoding UTF8

# Lire REVERB_*
function Get-EnvValue($text, $key) {
    $m = [regex]::Match($text, "(?m)^$key=`"?([^`"\r\n]*)`"?\s*$")
    if ($m.Success) { return $m.Groups[1].Value } else { return $null }
}

$reverbKey   = Get-EnvValue $content 'REVERB_APP_KEY'
$reverbHost  = Get-EnvValue $content 'REVERB_HOST'
$reverbPort  = Get-EnvValue $content 'REVERB_PORT'
$reverbScheme= Get-EnvValue $content 'REVERB_SCHEME'

if (-not $reverbKey) { throw 'REVERB_APP_KEY introuvable dans backend/.env' }
if (-not $reverbHost)  { $reverbHost  = 'localhost' }
if (-not $reverbPort)  { $reverbPort  = '8080' }
if (-not $reverbScheme){ $reverbScheme= 'http' }

$forceTls = if ($reverbScheme -eq 'https') { 'true' } else { 'false' }

# 2) frontend/.env.local : append/refresh notifications WS block
$marker = '# >>> GREEN_EXPRESS_REALTIME (auto)'
$endMarker = '# <<< GREEN_EXPRESS_REALTIME (auto)'

$block = @"
$marker
NEXT_PUBLIC_NOTIFICATIONS_WS_ENABLED=true
NEXT_PUBLIC_NOTIFICATIONS_WS_LOAD_CDN=true
NEXT_PUBLIC_NOTIFICATIONS_WS_BROADCASTER=pusher
NEXT_PUBLIC_NOTIFICATIONS_WS_KEY=$reverbKey
NEXT_PUBLIC_NOTIFICATIONS_WS_CLUSTER=mt1
NEXT_PUBLIC_NOTIFICATIONS_WS_HOST=$reverbHost
NEXT_PUBLIC_NOTIFICATIONS_WS_PORT=$reverbPort
NEXT_PUBLIC_NOTIFICATIONS_WS_WSS_PORT=443
NEXT_PUBLIC_NOTIFICATIONS_WS_FORCE_TLS=$forceTls
NEXT_PUBLIC_NOTIFICATIONS_WS_CHANNEL=App.Models.User.{userId}
NEXT_PUBLIC_NOTIFICATIONS_WS_EVENT=.Illuminate\Notifications\Events\BroadcastNotificationCreated
$endMarker
"@

$existing = ''
if (Test-Path $frontendEnv) {
    $existing = Get-Content -Raw -Path $frontendEnv
} else {
    New-Item -ItemType File -Path $frontendEnv -Force | Out-Null
}

if ($existing -match [regex]::Escape($marker)) {
    $pattern = [regex]::Escape($marker) + '[\s\S]*?' + [regex]::Escape($endMarker)
    $existing = [regex]::Replace($existing, $pattern, [System.Text.RegularExpressions.Regex]::Escape($block).Replace('\','\\'))
    # simpler approach: just rewrite full block
    $existing = [regex]::Replace((Get-Content -Raw -Path $frontendEnv), $pattern, $block)
} else {
    if ($existing.Length -gt 0 -and -not $existing.EndsWith("`n")) { $existing += "`r`n" }
    $existing += $block + "`r`n"
}

Set-Content -NoNewline -Path $frontendEnv -Value $existing -Encoding UTF8

Write-Host "OK: BROADCAST_CONNECTION=reverb"
Write-Host "OK: NEXT_PUBLIC_NOTIFICATIONS_WS_KEY=$reverbKey"
Write-Host "OK: NEXT_PUBLIC_NOTIFICATIONS_WS_HOST=$reverbHost ; PORT=$reverbPort ; FORCE_TLS=$forceTls"
