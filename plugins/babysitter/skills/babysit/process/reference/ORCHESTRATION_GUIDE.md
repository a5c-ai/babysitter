# Babysitter Skill - Hook-Driven Orchestration Guide

**Version:** 4.0 - Pure Hook Execution Architecture
**Date:** 2026-01-19

## Overview

The babysitter orchestration system is now **fully hook-driven**. The skill simply calls `run:iterate` repeatedly:

1. **Hook executes orchestration actions** (on-iteration-start hook runs tasks directly)
2. **Hook returns results** as JSON (action, status, count)
3. **Skill calls run:iterate again** based on status
4. **Repeats** until run is complete

**Key principle: Hooks execute, skill loops. SDK never runs tasks automatically.**

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Babysitter Skill (ONLY provides the loop)                  │
│                                                             │
│  while (not terminal):                                     │
│    1. Call: run:iterate <runId>                           │
│    2. Read status from stdout (executed/waiting/complete) │
│    3. If terminal, exit                                   │
│    4. Otherwise, call run:iterate again                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ run:iterate CLI Command (Single Iteration)                 │
│                                                             │
│  1. Call on-iteration-start hook                          │
│  2. Hook executes orchestration (runs tasks)              │
│  3. Hook returns results (action, status, count)          │
│  4. Call on-iteration-end hook                            │
│  5. Return results as JSON to stdout                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ on-iteration-start Hook (EXECUTES orchestration)           │
│                                                             │
│  - Get run status and pending tasks                       │
│  - Execute auto-runnable tasks and post results (calls task:post)  │
│  - OR wait for breakpoints/sleeps                         │
│  - Return execution results                               │
└─────────────────────────────────────────────────────────────┘
```

## CLI Command: `run:iterate`

### Usage

```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"
$CLI run:iterate <runDir> [--json] [--verbose] [--iteration <n>]
```

### Output Format

**With --json flag:**

```json
{
  "iteration": 1,
  "status": "executed",
  "action": "executed-tasks",
  "reason": "auto-runnable-tasks",
  "count": 2,
  "metadata": {
    "runId": "run-20260119-example",
    "processId": "dev/build",
    "hookStatus": "executed"
  }
}
```

### Status Values

- **`"executed"`** - Hook executed tasks this iteration (continue looping)
- **`"waiting"`** - Hook waiting (breakpoint or sleep - pause orchestration)
- **`"completed"`** - Run finished successfully (exit loop)
- **`"failed"`** - Run failed with error (exit loop)
- **`"none"`** - No action taken (no pending effects or unknown state)

### Action Values (from hook)

- **`"executed-tasks"`** - Hook executed one or more tasks
- **`"waiting"`** - Hook is waiting (breakpoint, sleep, etc.)
- **`"none"`** - No action needed (terminal state or no pending effects)

## Orchestration Loop in Skill

### Basic Loop

```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"
RUN_DIR=".a5c/runs/<runId>"
ITERATION=0

while true; do
  ((ITERATION++))

  # Call run:iterate - hook executes tasks internally
  RESULT=$($CLI run:iterate "$RUN_DIR" --json --iteration $ITERATION)

  STATUS=$(echo "$RESULT" | jq -r '.status')
  ACTION=$(echo "$RESULT" | jq -r '.action // "none"')
  REASON=$(echo "$RESULT" | jq -r '.reason // "unknown"')
  COUNT=$(echo "$RESULT" | jq -r '.count // 0')

  echo "Iteration $ITERATION: status=$STATUS action=$ACTION count=$COUNT reason=$REASON"

  # Check terminal states
  if [ "$STATUS" = "completed" ]; then
    echo "Run completed successfully"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Run failed"
    break
  elif [ "$STATUS" = "waiting" ]; then
    echo "Run waiting: $REASON"
    break
  fi

  # Status "executed" or "none" - continue looping
  # Hook already executed tasks, just iterate again
done
```

### Advanced Loop with Error Handling

```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"
RUN_DIR=".a5c/runs/<runId>"
ITERATION=0
MAX_ITERATIONS=100

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ((ITERATION++))

  echo "[skill] === Iteration $ITERATION ===" >&2

  # Call run:iterate
  if ! RESULT=$($CLI run:iterate "$RUN_DIR" --json --iteration $ITERATION 2>&1); then
    echo "[skill] Error calling run:iterate: $RESULT" >&2
    exit 1
  fi

  # Parse result
  STATUS=$(echo "$RESULT" | jq -r '.status')
  EFFECT_COUNT=$(echo "$RESULT" | jq -r '.effects | length')
  REASON=$(echo "$RESULT" | jq -r '.reason // "unknown"')

  echo "[skill] Status: $STATUS, Effects: $EFFECT_COUNT, Reason: $REASON" >&2

  # Handle terminal states
  case "$STATUS" in
    completed)
      echo "[skill] Run completed successfully" >&2
      exit 0
      ;;
    failed)
      ERROR=$(echo "$RESULT" | jq -r '.error // "Unknown error"')
      echo "[skill] Run failed: $ERROR" >&2
      exit 1
      ;;
    waiting)
      echo "[skill] Run waiting: $REASON" >&2

      # Check if breakpoint
      if [ "$REASON" = "breakpoint-waiting" ]; then
        echo "[skill] Breakpoint requires user input" >&2
        # Handle breakpoint using on-breakpoint hook or breakpoint skill
        # Then continue orchestration
        # (implementation depends on breakpoint handling strategy)
      fi

      # For sleep or unknown reasons, pause orchestration
      exit 0
      ;;
  esac

  # Perform effects
  EFFECTS_PERFORMED=0
  echo "$RESULT" | jq -c '.effects[]' | while read -r effect; do
    EFFECT_TYPE=$(echo "$effect" | jq -r '.type')
    EFFECT_ID=$(echo "$effect" | jq -r '.effectId // "unknown"')

    echo "[skill] Performing effect: $EFFECT_TYPE ($EFFECT_ID)" >&2

    case "$EFFECT_TYPE" in
      execute-task)
        if ! $CLI task:post "$RUN_DIR" "$EFFECT_ID" --status ok 2>&1 >&2; then
          echo "[skill] Warning: Task $EFFECT_ID failed" >&2
          # Continue with other tasks (error recorded in journal)
        fi
        ((EFFECTS_PERFORMED++))
        ;;

      handle-breakpoint)
        echo "[skill] Breakpoint handling not yet implemented" >&2
        # TODO: Implement breakpoint handling
        ;;

      wait-until)
        UNTIL=$(echo "$effect" | jq -r '.until')
        CURRENT_TIME=$(date +%s)000  # Convert to milliseconds
        WAIT_MS=$((UNTIL - CURRENT_TIME))

        if [ $WAIT_MS -gt 0 ]; then
          WAIT_SECONDS=$((WAIT_MS / 1000))
          echo "[skill] Sleeping for $WAIT_SECONDS seconds" >&2
          sleep "$WAIT_SECONDS"
        fi
        ;;

      *)
        echo "[skill] Unknown effect type: $EFFECT_TYPE" >&2
        ;;
    esac
  done

  # Small delay between iterations
  sleep 0.5
done

echo "[skill] Maximum iterations ($MAX_ITERATIONS) reached" >&2
exit 1
```

## Skill Instructions (Updated)

Add this to the babysitter skill instructions:

### Section: Orchestration via run:iterate

When orchestrating a run:

1. **Call `run:iterate` for each iteration:**
   ```bash
   $CLI run:iterate <runDir> --json
   ```

2. **Parse the JSON output:**
   - Check `status` field
   - Get `effects` array
   - Read `reason` for context

3. **Handle status:**
   - `"effects"` → Perform effects and iterate again
   - `"completed"` → Run finished, report success
   - `"failed"` → Run failed, report error
   - `"waiting"` → Breakpoint/sleep, pause or handle

4. **Perform effects:**
   - `execute-task` → Call `task:post <runDir> <effectId> --status <ok|error>`
   - `handle-breakpoint` → Use on-breakpoint hook
   - `wait-until` → Sleep until specified time

5. **Repeat** until terminal state (completed/failed) or waiting state

### Example Skill Implementation

```typescript
async function orchestrateRun(runId: string) {
  const CLI = "npx -y @a5c-ai/babysitter-sdk@latest";
  const runDir = `.a5c/runs/${runId}`;
  let iteration = 0;

  while (iteration < 100) {
    iteration++;

    // Get orchestration decision from hooks
    const result = await bash(`${CLI} run:iterate ${runDir} --json --iteration ${iteration}`);
    const { status, effects, reason } = JSON.parse(result.stdout);

    // Terminal states
    if (status === "completed") {
      console.log("Run completed successfully");
      return { status: "completed" };
    }

    if (status === "failed") {
      console.error("Run failed");
      return { status: "failed" };
    }

    // Waiting state (breakpoint, sleep, etc.)
    if (status === "waiting") {
      console.log(`Run waiting: ${reason}`);

      if (reason === "breakpoint-waiting") {
        // Handle breakpoint (use on-breakpoint hook or ask user)
        // After handling, continue iteration
        continue;
      }

      // For other waiting reasons, pause
      return { status: "waiting", reason };
    }

    // Perform effects
    for (const effect of effects) {
      if (effect.type === "execute-task") {
        console.log(`Executing task: ${effect.effectId}`);
        await bash(`${CLI} task:post ${runDir} ${effect.effectId} --status ok`);
      } else if (effect.type === "handle-breakpoint") {
        // Handle breakpoint
        console.log(`Breakpoint: ${effect.effectId}`);
        // Implementation specific to breakpoint handling
      } else if (effect.type === "wait-until") {
        // Sleep until specified time
        const waitMs = effect.until - Date.now();
        if (waitMs > 0) {
          await sleep(waitMs);
        }
      }
    }
  }

  throw new Error("Maximum iterations reached");
}
```

## Benefits of Hook-Driven Orchestration

### For the Skill

1. **Simple loop** - Just call `run:iterate` and perform effects
2. **No orchestration logic** - Hooks decide what to do
3. **Customizable** - Users can override orchestration via hooks
4. **Predictable** - Clear contract with well-defined effect types

### For Users

1. **Override orchestration** - Add custom hooks to change behavior
2. **No code changes** - Just add shell scripts
3. **Per-project customization** - Different strategies per repo
4. **Easy debugging** - Hooks are simple shell scripts

## Troubleshooting

### Iteration returns empty effects

Check hook output:
```bash
$CLI run:iterate <runDir> --verbose 2>&1 | grep "\[native-orchestrator\]"
```

### Effects not being performed

Ensure you're reading from stdout (not stderr):
```bash
RESULT=$($CLI run:iterate <runDir> --json)
# NOT: RESULT=$($CLI run:iterate <runDir> --json 2>&1)
```

### Hook errors

Hooks log to stderr, check for errors:
```bash
$CLI run:iterate <runDir> --verbose
```

## Migration from Old Orchestration

### Old Way (run:continue with loop)

```bash
# OLD: CLI contains loop
$CLI run:continue <runDir> --auto-node-tasks
```

### New Way (run:iterate called by skill)

```bash
# NEW: Skill contains loop, CLI does one iteration
while true; do
  RESULT=$($CLI run:iterate <runDir> --json)
  # Parse and perform effects
done
```

## Summary

The hook-driven orchestration architecture:

- ✅ **Hooks decide** what to do (pure decision making)
- ✅ **CLI handles one iteration** (calls hooks, returns effects)
- ✅ **Skill performs effects** (executes tasks, handles breakpoints)
- ✅ **Fully customizable** (override hooks at any level)
- ✅ **Clean separation** (decision vs execution)

This makes orchestration behavior fully customizable while keeping the skill implementation simple.
