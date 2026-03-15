---
name: babysitter
description: Orchestrate complex multi-step workflows using babysitter SDK
---

# Babysitter Orchestration

Use this skill to orchestrate complex, multi-step coding workflows through babysitter's process-driven execution engine.

## How It Works

1. Babysitter creates a **run** from a **process definition** (JavaScript file with tasks)
2. Each iteration produces **effects** (tasks to execute)
3. You execute the effects and post results back
4. The loop continues until the run completes

## Starting a Run

Use the SDK bridge directly (imported from the extension):
- `createNewRun()` to create a run
- `iterate()` to advance the orchestration
- `postResult()` to report effect outcomes

## Effect Types

| Kind | Action |
|------|--------|
| agent | Execute as sub-agent task |
| node | Run Node.js script |
| shell | Run shell command |
| breakpoint | Ask user for approval |
| sleep | Wait until timestamp |
| skill | Expand and execute skill |

## Completion

When the run completes, the SDK returns a completion proof. Output it wrapped in `<promise>PROOF_VALUE</promise>` tags.
