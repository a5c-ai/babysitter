# Run Resumption: Pause and Continue Workflows

**Version:** 1.1
**Last Updated:** 2026-01-26
**Category:** Feature Guide

---

## In Plain English

**You can stop and come back later. Nothing is lost.**

Close your laptop, end your session, or even have your computer crash - when you come back, just say "resume" and Babysitter picks up exactly where it left off.

**Common scenarios:**
- 🔋 Your laptop battery dies → resume later
- ⏸️ Waiting for someone to approve → resume when they approve
- 🌙 End of workday → resume tomorrow morning

**How to resume:** Just tell Babysitter to continue your previous work, or use the CLI command shown below.

---

## Overview

Run resumption enables pausing and continuing Babysitter workflows at any point. Whether a session times out, a breakpoint awaits approval, or you simply need to continue later, Babysitter's event-sourced architecture ensures no work is lost. Workflows automatically resume from exactly where they left off.

### Why Use Run Resumption

- **Session Independence**: Continue workflows across multiple Claude Code sessions
- **Breakpoint Handling**: Pause for human review and resume after approval
- **Failure Recovery**: Recover from crashes or network issues without losing progress
- **Flexible Scheduling**: Start work now, continue later when convenient
- **Team Handoffs**: One person can start a workflow, another can continue it

---

## Use Cases and Scenarios

### Scenario 1: Resume After Session Timeout

A workflow is interrupted when a Claude Code session ends unexpectedly.

```bash
# Session 1: Start a workflow
claude "/babysitter:call implement user authentication with TDD"

# ... session times out mid-execution ...

# Session 2: Resume the workflow
claude "/babysitter:call resume --run-id 01KFFTSF8TK8C9GT3YM9QYQ6WG"
```

### Scenario 2: Continue After Breakpoint Approval

A workflow pauses at a breakpoint while you review and approve changes.

```bash
# Workflow reaches breakpoint and pauses
# "Waiting for approval at breakpoint: Plan Review"

# Later, after reviewing and approving via web UI or Telegram:
claude "/babysitter:call resume the babysitter run for the auth feature"
```

### Scenario 3: Team Handoff

One team member starts work during the day, another continues overnight.

```bash
# Developer A (morning): Creates and starts run
babysitter run:create \
  --process-id feature/auth \
  --entry ./code/main.js#process \
  --inputs ./inputs.json

# Developer B (evening): Continues the run
claude "/babysitter:call resume --run-id feature-auth-20260125"
```

### Scenario 4: Retry After Failure

A task fails due to a transient error. Fix the issue and resume.

```bash
# Run fails with error
# "Error: API rate limit exceeded"

# After waiting for rate limit to reset:
claude "/babysitter:call resume --run-id 01KFFTSF8TK8C9GT3YM9QYQ6WG"
```

---

## Step-by-Step Instructions

### Step 1: Find the Run ID

List available runs or check the output from when you started the workflow.

**From initial output:**
```
Run ID: 01KFFTSF8TK8C9GT3YM9QYQ6WG
Run Directory: .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/
```

**List recent runs:**
```bash
ls -lt .a5c/runs/ | head -10
```

**Check run status:**
```bash
babysitter run:status 01KFFTSF8TK8C9GT3YM9QYQ6WG --json
```

### Step 2: Check Run Status

Verify the run's current state before resuming.

```bash
babysitter run:status 01KFFTSF8TK8C9GT3YM9QYQ6WG --json
```

**Example output:**
```json
{
  "runId": "01KFFTSF8TK8C9GT3YM9QYQ6WG",
  "state": "waiting",
  "metadata": {
    "processId": "feature/auth",
    "stateVersion": 42,
    "pendingEffectsByKind": {
      "breakpoint": 1
    }
  }
}
```

**State values:**
- `running` - Active execution (may be from another session)
- `waiting` - Paused at breakpoint or sleep
- `completed` - Finished successfully
- `failed` - Terminated with error

### Step 3: Resume the Run

Use the babysitter skill or CLI to resume execution.

**Via skill (natural language):**
```
Resume the babysitter run for the auth feature
```

**Via slash command:**
```bash
/babysitter:call resume --run-id 01KFFTSF8TK8C9GT3YM9QYQ6WG
```

**Via CLI (for scripting):**
```bash
babysitter run:iterate 01KFFTSF8TK8C9GT3YM9QYQ6WG --json
```

### Step 4: Handle Pending Actions

If the run is waiting, resolve any pending actions before resuming.

**Pending breakpoint:**
1. Open http://localhost:3184
2. Review and approve the breakpoint
3. Resume the run

**Pending sleep:**
- Wait until the sleep deadline passes
- Or manually advance time in testing scenarios

### Step 5: Monitor Progress

Watch the resumed workflow's progress.

```bash
# View recent events
babysitter run:events 01KFFTSF8TK8C9GT3YM9QYQ6WG --limit 10 --reverse

# Check for new pending tasks
babysitter task:list 01KFFTSF8TK8C9GT3YM9QYQ6WG --pending --json
```

---

## Configuration Options

### Run Status States

| State | Description | Can Resume? |
|-------|-------------|-------------|
| `running` | Currently executing | Check if session is active |
| `waiting` | Paused at breakpoint/sleep | Yes |
| `completed` | Finished successfully | No (already done) |
| `failed` | Terminated with error | Depends on error type |

### Resume Command Options

```bash
/babysitter:call resume --run-id <id> [--max-iterations <n>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--run-id` | string | Required | The run ID to resume |
| `--max-iterations` | number | Unlimited | Maximum iterations for this session |

### CLI Resume Commands

**Single iteration:**
```bash
babysitter run:iterate <runId> --json
```

**Check status:**
```bash
babysitter run:status <runId> --json
```

---

## Code Examples and Best Practices

### Example 1: Resume via Skill (Recommended)

The simplest way to resume a run is through natural language:

```
Claude, resume the babysitter run 01KFFTSF8TK8C9GT3YM9QYQ6WG
```

Or:

```
Continue the babysitter run for the authentication feature
```

### Example 2: Resume via CLI Script

For automated scenarios, use the CLI in a loop:

```bash
#!/bin/bash
set -euo pipefail

RUN_ID="01KFFTSF8TK8C9GT3YM9QYQ6WG"
CLI="npx -y @a5c-ai/babysitter-sdk@latest"

# Check current status
STATUS=$($CLI run:status "$RUN_ID" --json | jq -r '.state')

if [ "$STATUS" = "completed" ]; then
  echo "Run already completed"
  exit 0
elif [ "$STATUS" = "failed" ]; then
  echo "Run previously failed, cannot resume"
  exit 1
fi

# Resume loop
while true; do
  RESULT=$($CLI run:iterate "$RUN_ID" --json)
  ITER_STATUS=$(echo "$RESULT" | jq -r '.status')

  echo "Iteration status: $ITER_STATUS"

  case "$ITER_STATUS" in
    "completed")
      echo "Run completed successfully"
      exit 0
      ;;
    "failed")
      echo "Run failed"
      exit 1
      ;;
    "waiting")
      echo "Run waiting (breakpoint or sleep)"
      exit 0
      ;;
    *)
      # executed or none - continue
      ;;
  esac
done
```

### Example 3: Inspect Run Before Resuming

Check what happened and what's pending:

```bash
# Get run metadata
cat .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/run.json | jq .

# View recent journal events
babysitter run:events 01KFFTSF8TK8C9GT3YM9QYQ6WG --limit 20 --reverse --json | jq '.events[] | {seq, type, timestamp}'

# Check pending tasks
babysitter task:list 01KFFTSF8TK8C9GT3YM9QYQ6WG --pending --json | jq '.tasks[] | {effectId, kind, status}'
```

### Example 4: Resume After Fixing an Issue

When a task fails due to a fixable issue:

```bash
# 1. Check what failed
babysitter run:events "$RUN_ID" --filter-type RUN_FAILED --json | jq '.events[].payload.error'

# 2. Fix the underlying issue (e.g., install missing dependency)
npm install missing-package

# 3. Resume the run
claude "/babysitter:call resume --run-id $RUN_ID"
```

### Example 5: Resumable Process Design

Design processes that are resumption-friendly:

```javascript
export async function process(inputs, ctx) {
  // Each phase is a separate task - resumption continues from last completed task

  // Phase 1: Research (if not done, this executes; if done, returns cached result)
  const research = await ctx.task(researchTask, { feature: inputs.feature });

  // Phase 2: Planning
  const plan = await ctx.task(planningTask, { research });

  // Breakpoint allows natural pause/resume point
  await ctx.breakpoint({
    question: 'Review plan before implementation?',
    title: 'Plan Approval'
  });

  // Phase 3: Implementation
  const impl = await ctx.task(implementTask, { plan });

  // Phase 4: Verification
  const verification = await ctx.task(verifyTask, { impl });

  return { success: verification.passed };
}
```

### Best Practices

1. **Use Descriptive Run IDs**: Include project name and date for easy identification
2. **Add Breakpoints at Natural Pause Points**: Design workflows with clear approval gates
3. **Check Status Before Resuming**: Verify the run is in a resumable state
4. **Handle Pending Actions**: Resolve breakpoints before attempting resume
5. **Monitor Journal Events**: Review what happened during previous execution
6. **Design Idempotent Tasks**: Tasks should handle being re-executed gracefully

---

## Common Pitfalls and Troubleshooting

### Pitfall 1: Attempting to Resume a Completed Run

**Symptom:** Resume has no effect.

**Cause:** The run already finished successfully.

**Solution:**
```bash
# Check if completed
babysitter run:status "$RUN_ID" --json | jq '.state'
# If "completed", the run is done - create a new run instead
```

### Pitfall 2: Breakpoint Not Resolved

**Symptom:** Resume says "waiting" but nothing happens.

**Cause:** Breakpoint awaiting approval.

**Solution:**
1. Check pending breakpoints:
   ```bash
   babysitter task:list "$RUN_ID" --pending --json | jq '.tasks[] | select(.kind == "breakpoint")'
   ```
2. Open http://localhost:3184 and approve/reject the breakpoint
3. Resume the run

### Pitfall 3: State Corruption After Manual Edits

**Symptom:** Run behaves unexpectedly after resume.

**Cause:** Manual edits to journal or state files.

**Solution:**
- Never manually edit `journal/` or `state/` files
- If state is corrupted, delete `state/state.json` and let CLI rebuild it:
  ```bash
  rm .a5c/runs/"$RUN_ID"/state/state.json
  babysitter run:status "$RUN_ID"  # Rebuilds state from journal
  ```

### Pitfall 4: Different Process Code After Resume

**Symptom:** Resume produces unexpected behavior.

**Cause:** Process code modified between sessions.

**Solution:**
- Avoid modifying process code for in-progress runs
- If changes are necessary, consider starting a new run
- The SDK stores `processRevision` to detect changes

### Pitfall 5: Session Conflict

**Symptom:** "Run is already being executed" error.

**Cause:** Another session is actively running the same run.

**Solution:**
- Wait for the other session to complete or pause
- Check if you have another Claude Code window running the same workflow
- If the previous session crashed, wait a moment and retry

### Pitfall 6: Missing Run Directory

**Symptom:** "Run not found" error.

**Cause:** Run directory doesn't exist or was cleaned up.

**Solution:**
```bash
# Check if directory exists
ls -la .a5c/runs/ | grep "$RUN_ID"

# If missing, the run may have been deleted or never created
# Create a new run instead
```

---

## How Resumption Works

### Event-Sourced State Reconstruction

When you resume a run, Babysitter:

1. **Loads the Journal**: Reads all events from `journal/` directory
2. **Reconstructs State**: Replays events to rebuild current state
3. **Identifies Position**: Determines what tasks have completed vs. pending
4. **Continues Execution**: Resumes process from the last completed point

```
Journal Events:
├── 000001.json  RUN_CREATED
├── 000002.json  EFFECT_REQUESTED (task-1)
├── 000003.json  EFFECT_RESOLVED (task-1) ✓
├── 000004.json  EFFECT_REQUESTED (task-2)
├── 000005.json  EFFECT_RESOLVED (task-2) ✓
├── 000006.json  EFFECT_REQUESTED (breakpoint-1)  ← Waiting here
└── (resume continues from breakpoint-1)
```

### Deterministic Replay

The process function re-executes from the beginning on resume:

```javascript
export async function process(inputs, ctx) {
  // On resume, ctx.task returns cached result immediately
  const task1Result = await ctx.task(task1, {});  // Returns cached result
  const task2Result = await ctx.task(task2, {});  // Returns cached result

  // Resume point - this is where we actually pause
  await ctx.breakpoint({ question: 'Continue?' });  // Waiting here

  // After breakpoint approval, execution continues
  const task3Result = await ctx.task(task3, {});
}
```

---

## Related Documentation

- [Breakpoints](./breakpoints.md) - Understand approval gates that cause pauses
- [Journal System](./journal-system.md) - Learn how state is persisted
- [Process Definitions](./process-definitions.md) - Design resumable workflows

---

## Summary

Run resumption is a fundamental Babysitter capability that ensures workflow progress is never lost. The event-sourced journal captures every state change, enabling workflows to resume from exactly where they paused. Use breakpoints for natural pause points, check run status before resuming, and design processes with resumption in mind.
