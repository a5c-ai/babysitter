param(
  [switch]$AutoResolve
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[scenario] $msg" }
function Fail($msg) { Write-Host "[scenario] FAIL: $msg"; exit 1 }

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Prompt-Default([string]$Message, [string]$Default) {
  $answer = Read-Host "$Message [$Default]"
  if ([string]::IsNullOrWhiteSpace($answer)) { return $Default }
  return $answer
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$processDir = Join-Path $repoRoot ".a5c/processes"
$artifactsDir = Join-Path $repoRoot ".a5c/artifacts"
New-Item -ItemType Directory -Path $processDir -Force | Out-Null
New-Item -ItemType Directory -Path $artifactsDir -Force | Out-Null

$processId = "diagnostics/full-session-long-run"
$processPath = Join-Path $processDir "full-session-long-run-process.js"
$inputsPath = Join-Path $processDir "full-session-long-run-inputs.json"

$processSource = @'
/**
 * @process diagnostics/full-session-long-run
 * @description Long-session scenario with 3 interview breakpoints and simple artifact generation.
 * @skill babysitter/help ../../.codex/skills/babysitter/help/SKILL.md
 * @skill babysitter/assimilate ../../.codex/skills/babysitter/assimilate/SKILL.md
 * @agent codex-general ../../agents/codex-general/AGENT.md
 */
import { defineTask } from '@a5c-ai/babysitter-sdk';

const interviewPrimary = defineTask('interview-primary', (args, taskCtx) => ({
  kind: 'breakpoint',
  title: 'Interview: primary preferences',
  metadata: {
    label: 'interview-primary',
    payload: {
      title: 'Primary Preferences',
      questions: [
        'What background color do you want?',
        'What accent color do you want?',
        'What heading text should appear?',
        'What CTA button label should appear?'
      ],
      question: 'Answer all 4 fields: backgroundColor, accentColor, headingText, ctaLabel',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['interview', 'breakpoint'],
}));

const interviewSecondary = defineTask('interview-secondary', (args, taskCtx) => ({
  kind: 'breakpoint',
  title: 'Interview: style preferences',
  metadata: {
    label: 'interview-secondary',
    payload: {
      title: 'Style Preferences',
      question: 'Choose styleVariant and animationStyle',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['interview', 'breakpoint'],
}));

const interviewFinal = defineTask('interview-final', (args, taskCtx) => ({
  kind: 'breakpoint',
  title: 'Interview: final approval',
  metadata: {
    label: 'interview-final',
    payload: {
      title: 'Final Approval',
      question: 'Approve this configuration for generation?',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['interview', 'breakpoint'],
}));

const workUnit = defineTask('work-unit', (args, taskCtx) => ({
  kind: 'agent',
  title: `AI work unit ${args.index}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Long-session implementation worker',
      task: `Simulate one AI implementation unit #${args.index}`,
      context: { index: args.index, choices: args.choices },
      instructions: ['Return JSON {status:"ok", index:number, minutes:number, summary:string}'],
      outputFormat: 'JSON',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'work-unit'],
}));

const buildArtifact = defineTask('build-artifact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build simple themed artifact',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI builder',
      task: 'Generate the simple HTML artifact using selected colors and texts',
      context: { choices: args.choices, outputPath: args.outputPath },
      instructions: ['Return JSON containing outputPath and used choices'],
      outputFormat: 'JSON',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'artifact'],
}));

export async function process(inputs, ctx) {
  const primary = await ctx.task(interviewPrimary, {});
  const secondary = await ctx.task(interviewSecondary, {});
  const finalApproval = await ctx.task(interviewFinal, {});

  if (!finalApproval?.approved) {
    return { completed: false, reason: 'final approval rejected' };
  }

  const workUnits = Number(inputs.workUnits || 30);
  const choices = {
    backgroundColor: primary?.backgroundColor || '#0f172a',
    accentColor: primary?.accentColor || '#22d3ee',
    headingText: primary?.headingText || 'Scenario Heading',
    ctaLabel: primary?.ctaLabel || 'Run',
    styleVariant: secondary?.styleVariant || 'clean',
    animationStyle: secondary?.animationStyle || 'fade',
  };

  let simulatedAiMinutes = 0;
  for (let i = 1; i <= workUnits; i += 1) {
    const result = await ctx.task(workUnit, { index: i, choices });
    simulatedAiMinutes += Number(result?.minutes || 2);
  }

  const artifact = await ctx.task(buildArtifact, {
    choices,
    outputPath: inputs.outputPath || '.a5c/artifacts/full-session-simple-page.html',
  });

  return {
    completed: true,
    workUnits,
    simulatedAiMinutes,
    choices,
    artifact,
  };
}
'@

Write-Utf8NoBom -Path $processPath -Content $processSource

$inputs = @{
  workUnits = 30
  outputPath = ".a5c/artifacts/full-session-simple-page.html"
}
Write-Utf8NoBom -Path $inputsPath -Content ($inputs | ConvertTo-Json)

function Run-Babysitter([string[]]$commandArgs) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $result = & npx.cmd -y @a5c-ai/babysitter-sdk@0.0.173 @commandArgs 2>&1
  $ErrorActionPreference = $prev
  if ($LASTEXITCODE -ne 0) {
    Fail "Command failed: babysitter $($commandArgs -join ' ')`n$result"
  }
  return $result
}

function Parse-JsonFromText([string]$Text) {
  try { return ($Text | ConvertFrom-Json) } catch {}
  $lastObjStart = $Text.LastIndexOf("`n{")
  if ($lastObjStart -ge 0) {
    $candidate = $Text.Substring($lastObjStart + 1).Trim()
    try { return ($candidate | ConvertFrom-Json) } catch {}
  }
  $m = [regex]::Match($Text, '(\{[\s\S]*\}|\[[\s\S]*\])')
  if ($m.Success) {
    try { return ($m.Groups[1].Value | ConvertFrom-Json) } catch {}
  }
  return $null
}

Write-Info "Checking skill library..."
$skillBase = Join-Path $repoRoot ".codex/skills/babysitter"
$expectedSkills = @("call","yolo","resume","plan","forever","doctor","observe","help","project-install","user-install","assimilate")
$missingSkills = @()
foreach ($s in $expectedSkills) {
  $skillPath = Join-Path $skillBase "$s/SKILL.md"
  if (-not (Test-Path $skillPath)) { $missingSkills += $s }
}
if ($missingSkills.Count -gt 0) { Fail "Missing skills: $($missingSkills -join ', ')" }

Write-Info "Creating run..."
$createRaw = Run-Babysitter @("run:create","--process-id",$processId,"--entry","$processPath#process","--inputs",$inputsPath,"--json")
$createText = ($createRaw | Out-String).Trim()
$create = Parse-JsonFromText $createText
$null = $create
$runId = $create.runId
if (-not $runId) { Fail "run:create did not return runId: $createText" }

$choices = @{
  backgroundColor = "#123456"
  accentColor = "#ff7a00"
  headingText = "Babysitter Long Session Test"
  ctaLabel = "Launch"
  styleVariant = "clean-card"
  animationStyle = "fade-in"
}

$breakpointCount = 0
$breakpointWith4Questions = $false
$maxIterations = 400

Write-Info "Running iterative orchestration..."
if ($AutoResolve) {
  Write-Info "Auto-resolve mode enabled for breakpoints."
} else {
  Write-Info "Manual breakpoint mode enabled. You will be prompted to resolve each breakpoint."
}

for ($i = 1; $i -le $maxIterations; $i++) {
  $null = Run-Babysitter @("run:iterate",$runId,"--json","--iteration","$i")
  $status = (Run-Babysitter @("run:status",$runId,"--json") | Out-String | ConvertFrom-Json)
  if ($status.state -eq "completed" -or $status.state -eq "failed") { break }

  $pending = (Run-Babysitter @("task:list",$runId,"--pending","--json") | Out-String | ConvertFrom-Json).tasks
  foreach ($task in @($pending)) {
    $effectId = $task.effectId
    if (-not $effectId) { continue }

    $taskDir = Join-Path $repoRoot ".a5c/runs/$runId/tasks/$effectId"
    New-Item -ItemType Directory -Path $taskDir -Force | Out-Null
    $outPath = Join-Path $taskDir "output.json"
    $outRef = "tasks/$effectId/output.json"

    if ($task.kind -eq "breakpoint") {
      $breakpointCount += 1
      $taskJsonPath = Join-Path $taskDir "task.json"
      $taskDef = $null
      if (Test-Path $taskJsonPath) {
        $taskDef = Get-Content $taskJsonPath -Raw | ConvertFrom-Json
        $qCount = ($taskDef.metadata.payload.questions | Measure-Object).Count
        if ($qCount -ge 4) { $breakpointWith4Questions = $true }
      }

      $bpOutput = @{}
      if ($AutoResolve) {
        switch ($task.taskId) {
          "interview-primary" {
            $bpOutput = @{
              approved = $true
              backgroundColor = $choices.backgroundColor
              accentColor = $choices.accentColor
              headingText = $choices.headingText
              ctaLabel = $choices.ctaLabel
            }
          }
          "interview-secondary" {
            $bpOutput = @{
              approved = $true
              styleVariant = $choices.styleVariant
              animationStyle = $choices.animationStyle
            }
          }
          default {
            $bpOutput = @{
              approved = $true
              response = "Approved by full-session-long-run test"
            }
          }
        }
      } else {
        Write-Host ""
        Write-Host "[breakpoint] effectId: $effectId"
        Write-Host "[breakpoint] taskId: $($task.taskId)"
        if ($taskDef -and $taskDef.title) { Write-Host "[breakpoint] title: $($taskDef.title)" }
        if ($taskDef -and $taskDef.metadata -and $taskDef.metadata.payload -and $taskDef.metadata.payload.question) {
          Write-Host "[breakpoint] prompt: $($taskDef.metadata.payload.question)"
        }
        if ($taskDef -and $taskDef.metadata -and $taskDef.metadata.payload -and $taskDef.metadata.payload.questions) {
          $idx = 1
          foreach ($q in $taskDef.metadata.payload.questions) {
            Write-Host "[breakpoint] q${idx}: $q"
            $idx += 1
          }
        }

        switch ($task.taskId) {
          "interview-primary" {
            $choices.backgroundColor = Prompt-Default "backgroundColor" $choices.backgroundColor
            $choices.accentColor = Prompt-Default "accentColor" $choices.accentColor
            $choices.headingText = Prompt-Default "headingText" $choices.headingText
            $choices.ctaLabel = Prompt-Default "ctaLabel" $choices.ctaLabel
            $bpOutput = @{
              approved = $true
              backgroundColor = $choices.backgroundColor
              accentColor = $choices.accentColor
              headingText = $choices.headingText
              ctaLabel = $choices.ctaLabel
            }
          }
          "interview-secondary" {
            $choices.styleVariant = Prompt-Default "styleVariant" $choices.styleVariant
            $choices.animationStyle = Prompt-Default "animationStyle" $choices.animationStyle
            $bpOutput = @{
              approved = $true
              styleVariant = $choices.styleVariant
              animationStyle = $choices.animationStyle
            }
          }
          "interview-final" {
            $approval = Prompt-Default "Approve final configuration? (yes/no)" "yes"
            $approved = @("y","yes","true","1") -contains $approval.ToLowerInvariant()
            $bpOutput = @{
              approved = $approved
              response = if ($approved) { "Approved manually" } else { "Rejected manually" }
            }
          }
          default {
            $approval = Prompt-Default "Approve breakpoint? (yes/no)" "yes"
            $approved = @("y","yes","true","1") -contains $approval.ToLowerInvariant()
            $bpOutput = @{
              approved = $approved
              response = if ($approved) { "Approved manually" } else { "Rejected manually" }
            }
          }
        }
      }
      Write-Utf8NoBom -Path $outPath -Content ($bpOutput | ConvertTo-Json)
    } elseif ($task.taskId -eq "build-artifact") {
      $artifactPath = Join-Path $repoRoot ".a5c/artifacts/full-session-simple-page.html"
      $html = @"
<!doctype html>
<html>
<head>
  <meta charset='utf-8'>
  <title>Babysitter Long Session Test</title>
  <style>
    body { background: $($choices.backgroundColor); color: white; font-family: Arial, sans-serif; }
    .card { border: 2px solid $($choices.accentColor); padding: 20px; max-width: 680px; margin: 60px auto; }
    .btn { background: $($choices.accentColor); color: #111; padding: 10px 16px; display: inline-block; margin-top: 16px; text-decoration: none; }
  </style>
</head>
<body>
  <main class='card'>
    <h1>$($choices.headingText)</h1>
    <p>styleVariant: $($choices.styleVariant) | animationStyle: $($choices.animationStyle)</p>
    <a class='btn'>$($choices.ctaLabel)</a>
  </main>
</body>
</html>
"@
      Set-Content -Path $artifactPath -Value $html -Encoding utf8
      $agentOut = @{
        status = "ok"
        outputPath = ".a5c/artifacts/full-session-simple-page.html"
        usedChoices = $choices
      }
      Write-Utf8NoBom -Path $outPath -Content ($agentOut | ConvertTo-Json -Depth 6)
    } else {
      $defaultOut = @{
        status = "ok"
        minutes = 2
        summary = "Completed task $($task.taskId)"
      }
      Write-Utf8NoBom -Path $outPath -Content ($defaultOut | ConvertTo-Json)
    }

    $null = Run-Babysitter @("task:post",$runId,$effectId,"--status","ok","--value",$outRef,"--json")
  }
}

$final = (Run-Babysitter @("run:status",$runId,"--json") | Out-String | ConvertFrom-Json)
if ($final.state -ne "completed") { Fail "Run did not complete. Final state: $($final.state)" }

$stateOutputPath = Join-Path $repoRoot ".a5c/runs/$runId/state/output.json"
if (-not (Test-Path $stateOutputPath)) { Fail "Missing output.json: $stateOutputPath" }
$stateOutput = Get-Content $stateOutputPath -Raw | ConvertFrom-Json

$artifactFile = Join-Path $repoRoot ".a5c/artifacts/full-session-simple-page.html"
if (-not (Test-Path $artifactFile)) { Fail "Artifact file not created: $artifactFile" }
$artifactText = Get-Content $artifactFile -Raw

$score = 0
$details = @()

if ($final.state -eq "completed") { $score += 20; $details += "20/20 run completed" } else { $details += "0/20 run completion" }
if ($breakpointCount -ge 3 -and $breakpointWith4Questions) { $score += 20; $details += "20/20 breakpoint requirements met" } else { $details += "0/20 breakpoints (count=$breakpointCount, fourQuestions=$breakpointWith4Questions)" }

$choicesApplied = $artifactText.Contains($choices.backgroundColor) -and $artifactText.Contains($choices.accentColor) -and $artifactText.Contains($choices.headingText) -and $artifactText.Contains($choices.ctaLabel)
if ($choicesApplied) { $score += 20; $details += "20/20 choices applied to artifact" } else { $details += "0/20 choices not fully reflected" }

$simMinutesRaw = $null
if ($stateOutput.PSObject.Properties.Name -contains "simulatedAiMinutes") {
  $simMinutesRaw = $stateOutput.simulatedAiMinutes
} elseif ($stateOutput.PSObject.Properties.Name -contains "value") {
  $simMinutesRaw = $stateOutput.value.simulatedAiMinutes
}
$simMinutes = [int]($simMinutesRaw)
if ($simMinutes -ge 60) { $score += 20; $details += "20/20 long-session target met ($simMinutes minutes)" } else { $details += "0/20 long-session target failed ($simMinutes minutes)" }

$processFiles = Get-ChildItem -Path $processDir -Filter *.js -ErrorAction SilentlyContinue
if ($expectedSkills.Count -eq 11 -and $processFiles.Count -ge 1) { $score += 20; $details += "20/20 process+skill library checks passed" } else { $details += "0/20 process+skill library checks failed" }

Write-Info "Score: $score/100"
$details | ForEach-Object { Write-Host " - $_" }

if ($score -lt 100) {
  Write-Host "[scenario] Investigating failed criteria..."
  if ($breakpointCount -lt 3) { Write-Host "  * Breakpoint count too low." }
  if (-not $breakpointWith4Questions) { Write-Host "  * No breakpoint with 4 questions was detected." }
  if (-not $choicesApplied) { Write-Host "  * Artifact did not include all chosen values." }
  if ($simMinutes -lt 60) { Write-Host "  * Simulated AI minutes < 60." }
  Fail "Scenario score below 100"
}

$summary = @{
  ok = $true
  score = $score
  runId = $runId
  simulatedAiMinutes = $simMinutes
  breakpoints = $breakpointCount
  breakpointWith4Questions = $breakpointWith4Questions
  artifactFile = $artifactFile
}

Write-Info "PASS"
$summary | ConvertTo-Json -Depth 6
exit 0
