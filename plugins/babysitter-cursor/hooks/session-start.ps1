# Babysitter Session Start Hook for Cursor IDE/CLI (PowerShell)
# Ensures the babysitter SDK CLI is installed (from versions.json sdkVersion),
# then delegates to the SDK hook handler.
#
# Protocol:
#   Input:  JSON via stdin (contains session_id, cwd, etc.)
#   Output: JSON via stdout ({} on success)
#   Stderr: debug/log output only
#   Exit 0: success
#   Exit 2: block (fatal error)

$ErrorActionPreference = "Stop"

$PluginRoot = if ($env:CURSOR_PLUGIN_ROOT) { $env:CURSOR_PLUGIN_ROOT } else { Split-Path -Parent $PSScriptRoot }
$StateDir = if ($env:BABYSITTER_STATE_DIR) { $env:BABYSITTER_STATE_DIR } else { Join-Path $PWD ".a5c" }
$MarkerFile = Join-Path $PluginRoot ".babysitter-install-attempted"

$env:CURSOR_PLUGIN_ROOT = $PluginRoot
$env:BABYSITTER_STATE_DIR = $StateDir

$LogDir = if ($env:BABYSITTER_LOG_DIR) { $env:BABYSITTER_LOG_DIR } else { Join-Path $PluginRoot ".a5c\logs" }
$LogFile = Join-Path $LogDir "babysitter-session-start-hook.log"
New-Item -ItemType Directory -Path $LogDir -Force -ErrorAction SilentlyContinue | Out-Null

function Write-Blog {
    param([string]$Message)
    $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    Add-Content -Path $LogFile -Value "[INFO] $ts $Message" -ErrorAction SilentlyContinue
    if (Get-Command babysitter -ErrorAction SilentlyContinue) {
        & babysitter log --type hook --label "hook:session-start" --message $Message --source shell-hook 2>$null
    }
}

Write-Blog "Hook script invoked"
Write-Blog "PLUGIN_ROOT=$PluginRoot"
Write-Blog "STATE_DIR=$StateDir"

# Get required SDK version from versions.json
$versionsFile = Join-Path $PluginRoot "versions.json"
try {
    $SdkVersion = (Get-Content $versionsFile -Raw | ConvertFrom-Json).sdkVersion
    if (-not $SdkVersion) { $SdkVersion = "latest" }
} catch {
    $SdkVersion = "latest"
}

function Install-Sdk {
    param([string]$TargetVersion)
    try {
        & npm i -g "@a5c-ai/babysitter-sdk@$TargetVersion" --loglevel=error 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Blog "Installed SDK globally ($TargetVersion)"
            return $true
        }
    } catch {}
    try {
        $prefix = Join-Path $env:USERPROFILE ".local"
        & npm i -g "@a5c-ai/babysitter-sdk@$TargetVersion" --prefix $prefix --loglevel=error 2>$null
        if ($LASTEXITCODE -eq 0) {
            $env:PATH = "$prefix\bin;$env:PATH"
            Write-Blog "Installed SDK to user prefix ($TargetVersion)"
            return $true
        }
    } catch {}
    return $false
}

# Check if babysitter CLI exists and if version matches
$NeedsInstall = $false
if (Get-Command babysitter -ErrorAction SilentlyContinue) {
    $CurrentVersion = & babysitter --version 2>$null
    if ($CurrentVersion -ne $SdkVersion) {
        Write-Blog "SDK version mismatch: installed=$CurrentVersion, required=$SdkVersion"
        $NeedsInstall = $true
    } else {
        Write-Blog "SDK version OK: $CurrentVersion"
    }
} else {
    Write-Blog "SDK CLI not found, will install"
    $NeedsInstall = $true
}

# Install/upgrade if needed (only attempt once per plugin version)
if ($NeedsInstall -and -not (Test-Path $MarkerFile)) {
    Install-Sdk $SdkVersion | Out-Null
    Set-Content -Path $MarkerFile -Value $SdkVersion -ErrorAction SilentlyContinue
}

# If still not available after install attempt, try npx as last resort
$useFallback = $false
if (-not (Get-Command babysitter -ErrorAction SilentlyContinue)) {
    Write-Blog "CLI not found after install, using npx fallback"
    $useFallback = $true
}

# Capture stdin
$InputFile = [System.IO.Path]::GetTempFileName()
$input | Out-File -FilePath $InputFile -Encoding utf8

Write-Blog "Hook input received"

$stderrLog = Join-Path $LogDir "babysitter-session-start-hook-stderr.log"

if ($useFallback) {
    $Result = Get-Content $InputFile | & npx -y "@a5c-ai/babysitter-sdk@$SdkVersion" hook:run --hook-type session-start --harness cursor --plugin-root $PluginRoot --state-dir $StateDir --json 2>$stderrLog
} else {
    $Result = Get-Content $InputFile | & babysitter hook:run --hook-type session-start --harness cursor --plugin-root $PluginRoot --state-dir $StateDir --json 2>$stderrLog
}
$ExitCode = $LASTEXITCODE

Write-Blog "CLI exit code=$ExitCode"

Remove-Item $InputFile -Force -ErrorAction SilentlyContinue
Write-Output $Result
exit $ExitCode
