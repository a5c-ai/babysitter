# PowerShell hook wrapper — sets env vars and delegates to bash
$env:HOOK_TYPE = 'user-prompt-submit'
$env:ADAPTER_NAME = 'copilot'
$env:PLUGIN_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$input_data = [Console]::In.ReadToEnd()
$result = $input_data | & bash "$PSScriptRoot/../$($MyInvocation.MyCommand.Name -replace '\.ps1$','.sh')" 2>$null
if ($LASTEXITCODE -eq 0 -and $result) {
  Write-Output $result
} else {
  Write-Output '{}'
}
