# Babysitter userPromptSubmitted Hook for GitHub Copilot CLI (PowerShell)
# Applies density-filter compression to long user prompts.
#
# NOTE: Output from this hook is IGNORED by Copilot CLI.
# This hook is for logging and side-effects only.

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
New-Item -ItemType Directory -Path $LogDir -Force -ErrorAction SilentlyContinue | Out-Null

# Capture stdin
$InputFile = [System.IO.Path]::GetTempFileName()
$input | Out-File -FilePath $InputFile -Encoding utf8

$stderrLog = Join-Path $LogDir "babysitter-user-prompt-submitted-hook-stderr.log"

try {
    if ($useFallback) {
        Get-Content $InputFile | & npx -y "@a5c-ai/babysitter-sdk@$SdkVersion" hook:run --hook-type user-prompt-submitted --harness github-copilot --json 2>$stderrLog | Out-Null
    } elseif ($hasBabysitter) {
        Get-Content $InputFile | & babysitter hook:run --hook-type user-prompt-submitted --harness github-copilot --json 2>$stderrLog | Out-Null
    }
} catch {}

Remove-Item $InputFile -Force -ErrorAction SilentlyContinue

exit 0
