# Babysitter Session End Hook for GitHub Copilot CLI (PowerShell)
# Cleanup and logging on session exit.
#
# NOTE: Unlike Claude Code's Stop hook, sessionEnd output is IGNORED by
# Copilot CLI. This hook cannot block session exit or drive an orchestration
# loop. It is purely for cleanup and logging.

$ErrorActionPreference = "Continue"

$PluginRoot = if ($env:COPILOT_PLUGIN_DIR) { $env:COPILOT_PLUGIN_DIR } else { Split-Path -Parent $PSScriptRoot }

# Resolve babysitter CLI
$hasBabysitter = [bool](Get-Command babysitter -ErrorAction SilentlyContinue)
$useFallback = $false

if (-not $hasBabysitter) {
    $localBin = Join-Path $env:USERPROFILE ".local\bin\babysitter.cmd"
    if (Test-Path $localBin) {
        $env:PATH = "$(Split-Path $localBin);$env:PATH"
        $hasBabysitter = $true
    } else {
        $versionsFile = Join-Path $PluginRoot "versions.json"
        try {
            $SdkVersion = (Get-Content $versionsFile -Raw | ConvertFrom-Json).sdkVersion
            if (-not $SdkVersion) { $SdkVersion = "latest" }
        } catch {
            $SdkVersion = "latest"
        }
        $useFallback = $true
    }
}

$LogDir = if ($env:BABYSITTER_LOG_DIR) { $env:BABYSITTER_LOG_DIR } else { Join-Path $PluginRoot ".a5c\logs" }
$LogFile = Join-Path $LogDir "babysitter-session-end-hook.log"
New-Item -ItemType Directory -Path $LogDir -Force -ErrorAction SilentlyContinue | Out-Null

function Write-Blog {
    param([string]$Message)
    $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    Add-Content -Path $LogFile -Value "[INFO] $ts $Message" -ErrorAction SilentlyContinue
}

Write-Blog "Hook script invoked"
Write-Blog "PLUGIN_ROOT=$PluginRoot"

# Capture stdin
$InputFile = [System.IO.Path]::GetTempFileName()
$input | Out-File -FilePath $InputFile -Encoding utf8

Write-Blog "Hook input received"

$stderrLog = Join-Path $LogDir "babysitter-session-end-hook-stderr.log"

try {
    if ($useFallback) {
        Get-Content $InputFile | & npx -y "@a5c-ai/babysitter-sdk@$SdkVersion" hook:run --hook-type session-end --harness github-copilot --plugin-root $PluginRoot --json 2>$stderrLog | Out-Null
    } elseif ($hasBabysitter) {
        Get-Content $InputFile | & babysitter hook:run --hook-type session-end --harness github-copilot --plugin-root $PluginRoot --json 2>$stderrLog | Out-Null
    }
} catch {
    Write-Blog "Hook error: $_"
}

Write-Blog "Session end hook complete"

Remove-Item $InputFile -Force -ErrorAction SilentlyContinue

exit 0
