# Hook-Driven Orchestration Architecture

**Date:** 2026-01-19
**Version:** 3.0 - Hook-Driven Orchestration

## Overview

The babysitter orchestration system has been refactored to be **hook-driven**, meaning orchestration logic lives in hooks rather than CLI commands. This makes the entire orchestration system fully customizable and extensible.

## Architecture

### Traditional Approach (Before)

```
CLI Command (run:continue)
  ├─> Contains orchestration logic
  ├─> Calls SDK runtime
  ├─> Invokes hooks as side effects
  └─> Returns result
```

### Hook-Driven Approach (Now)

```
CLI Command (hook-driven-orchestrate)
  ├─> Invokes on-iteration-start hook
  │   └─> Hook contains orchestration logic
  │       ├─> Analyzes run state
  │       ├─> Calls CLI commands (task:post, etc.)
  │       └─> Returns orchestration decision
  ├─> CLI executes hook decision
  ├─> Invokes on-iteration-end hook
  │   └─> Hook determines if more iterations needed
  └─> Repeats until terminal state
```

## Benefits

### 1. Full Customization
Override orchestration behavior at any level:
- **Per-repo**: Project-specific orchestration logic
- **Per-user**: User preferences and optimizations
- **Plugin**: Default behavior

### 2. Composable Logic
Multiple hooks can contribute to orchestration decisions:
- One hook analyzes priorities
- Another implements rate limiting
- Another handles error recovery

### 3. No Code Changes Needed
Replace orchestration logic without modifying SDK or CLI:
- Just add a hook script
- No TypeScript compilation
- No npm installs

### 4. Easy Testing
Test orchestration strategies independently:
- Mock CLI commands
- Test hook logic in isolation
- Verify orchestration decisions

## Components

### 1. Native Orchestrator Hook

**Location:** `plugins/babysitter/hooks/on-iteration-start/native-orchestrator.sh`

**Purpose:** Implements the default SDK orchestration logic via hooks

**What it does:**
- Analyzes run status
- Identifies auto-runnable tasks
- Executes node tasks via CLI
- Handles breakpoints and sleep effects
- Returns orchestration decision

**Example output:**
```json
{
  "action": "executed-tasks",
  "count": 3,
  "tasks": ["effect-001", "effect-002", "effect-003"]
}
```

### 2. Native Finalization Hook

**Location:** `plugins/babysitter/hooks/on-iteration-end/native-finalization.sh`

**Purpose:** Post-iteration cleanup and status determination

**What it does:**
- Checks final iteration status
- Counts remaining pending effects
- Determines if more iterations needed
- Returns continuation decision

**Example output:**
```json
{
  "iteration": 5,
  "finalStatus": "waiting",
  "pendingEffects": 2,
  "needsMoreIterations": true
}
```

### 3. Hook-Driven Orchestration Script

**Location:** `plugins/babysitter/scripts/hook-driven-orchestrate.sh`

**Purpose:** CLI wrapper that delegates to hooks

**Usage:**
```bash
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/<runId>
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/<runId> --max-iterations 50
```

**What it does:**
1. Loops until terminal state or max iterations
2. For each iteration:
   - Calls `on-iteration-start` hooks
   - Executes hook-decided actions
   - Calls `on-iteration-end` hooks
   - Checks if more iterations needed
3. Returns final status

## Custom Orchestration Examples

### Example 1: Simple Sequential Executor

Override the default orchestration with simple sequential execution:

**File:** `.a5c/hooks/on-iteration-start/sequential.sh`

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_ID"

# Just run the first pending task
FIRST_TASK=$(npx -y @a5c-ai/babysitter-sdk@latest task:list "$RUN_DIR" --pending --json | \
  jq -r '.[0].effectId // empty')

if [ -n "$FIRST_TASK" ]; then
  npx -y @a5c-ai/babysitter-sdk@latest task:post "$RUN_DIR" "$FIRST_TASK" --status ok
  echo '{"action":"executed-tasks","count":1,"tasks":["'$FIRST_TASK'"]}'
else
  echo '{"action":"none","reason":"no-tasks"}'
fi
```

### Example 2: Parallel Batch Executor

Execute multiple tasks in parallel:

**File:** `.a5c/hooks/on-iteration-start/parallel.sh`

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_DIR"

# Get up to 5 pending tasks
TASKS=$(npx -y @a5c-ai/babysitter-sdk@latest task:list "$RUN_DIR" --pending --json | \
  jq -r '.[0:5] | .[].effectId')

# Run in parallel
PIDS=()
for task in $TASKS; do
  npx -y @a5c-ai/babysitter-sdk@latest task:post "$RUN_DIR" "$task" --status ok &
  PIDS+=($!)
done

# Wait for all
for pid in "${PIDS[@]}"; do
  wait "$pid"
done

TASK_ARRAY=$(echo "$TASKS" | jq -R . | jq -s .)
echo '{"action":"executed-tasks","count":'${#PIDS[@]}',"tasks":'$TASK_ARRAY'}'
```

### Example 3: Priority-Based Executor

Execute high-priority tasks first:

**File:** `.a5c/hooks/on-iteration-start/priority.sh`

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_ID"

# Get all pending tasks and sort by priority metadata
HIGH_PRIORITY=$(npx -y @a5c-ai/babysitter-sdk@latest task:list "$RUN_DIR" --pending --json | \
  jq -r 'sort_by(.metadata.priority // 0) | reverse | .[0].effectId')

if [ -n "$HIGH_PRIORITY" ] && [ "$HIGH_PRIORITY" != "null" ]; then
  npx -y @a5c-ai/babysitter-sdk@latest task:post "$RUN_DIR" "$HIGH_PRIORITY" --status ok
  echo '{"action":"executed-tasks","count":1,"tasks":["'$HIGH_PRIORITY'"],"priority":true}'
else
  echo '{"action":"none","reason":"no-high-priority-tasks"}'
fi
```

### Example 4: Rate-Limited Executor

Limit task execution rate:

**File:** `.a5c/hooks/on-iteration-start/rate-limited.sh`

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_ID"
RATE_LIMIT_FILE=".a5c/runs/$RUN_ID/.rate-limit"

# Check last execution time
if [ -f "$RATE_LIMIT_FILE" ]; then
  LAST_EXEC=$(cat "$RATE_LIMIT_FILE")
  CURRENT_TIME=$(date +%s)
  TIME_DIFF=$((CURRENT_TIME - LAST_EXEC))

  # Enforce 5-second minimum between executions
  if [ $TIME_DIFF -lt 5 ]; then
    WAIT_TIME=$((5 - TIME_DIFF))
    echo '{"action":"waiting","reason":"rate-limit","waitSeconds":'$WAIT_TIME'}'
    exit 0
  fi
fi

# Execute one task
TASK=$(npx -y @a5c-ai/babysitter-sdk@latest task:list "$RUN_DIR" --pending --json | \
  jq -r '.[0].effectId // empty')

if [ -n "$TASK" ]; then
  npx -y @a5c-ai/babysitter-sdk@latest task:post "$RUN_DIR" "$TASK" --status ok
  date +%s > "$RATE_LIMIT_FILE"
  echo '{"action":"executed-tasks","count":1,"tasks":["'$TASK'"]}'
else
  echo '{"action":"none","reason":"no-tasks"}'
fi
```

### Example 5: Conditional Strategy Executor

Choose strategy based on run metadata:

**File:** `.a5c/hooks/on-iteration-start/adaptive.sh`

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_ID"

# Read run metadata to determine strategy
RUN_METADATA=$(cat "$RUN_DIR/run.json")
STRATEGY=$(echo "$RUN_METADATA" | jq -r '.metadata.orchestrationStrategy // "sequential"')

echo "[adaptive] Using strategy: $STRATEGY" >&2

case "$STRATEGY" in
  parallel)
    # Execute 3 tasks in parallel
    exec .a5c/hooks/on-iteration-start/parallel.sh
    ;;
  priority)
    # Execute highest priority
    exec .a5c/hooks/on-iteration-start/priority.sh
    ;;
  sequential|*)
    # Default sequential
    exec .a5c/hooks/on-iteration-start/sequential.sh
    ;;
esac
```

## Hook Contract

### on-iteration-start

**Input (stdin):**
```json
{
  "runId": "run-20260119-example",
  "iteration": 5,
  "timestamp": "2026-01-19T18:00:00Z"
}
```

**Output (stdout):**
```json
{
  "action": "executed-tasks" | "waiting" | "none",
  "reason": "string",
  "count": number,
  "tasks": ["effectId1", "effectId2"]
}
```

**Actions:**
- `executed-tasks` - Hook executed one or more tasks
- `waiting` - Hook determined run should wait (breakpoint, sleep, etc.)
- `none` - No action taken (terminal state, no pending effects, etc.)

### on-iteration-end

**Input (stdin):**
```json
{
  "runId": "run-20260119-example",
  "iteration": 5,
  "status": "waiting" | "completed" | "failed",
  "timestamp": "2026-01-19T18:00:00Z"
}
```

**Output (stdout):**
```json
{
  "iteration": 5,
  "finalStatus": "waiting" | "completed" | "failed",
  "pendingEffects": number,
  "needsMoreIterations": boolean
}
```

## Migration Path

### Phase 1: Coexistence (Current)
- Traditional CLI commands work as before
- New hook-driven script available as alternative
- Users can test hook-driven orchestration

### Phase 2: Hook Enhancement
- Add more hook types for finer control
- Add hook composition utilities
- Add hook testing framework

### Phase 3: CLI Delegation (Future)
- Main CLI commands delegate to hooks by default
- Keep traditional mode as fallback
- Deprecate direct orchestration logic in CLI

## Testing

### Test Hook Scripts

```bash
# Test on-iteration-start hook directly
echo '{"runId":"test-run","iteration":1,"timestamp":"2026-01-19T18:00:00Z"}' | \
  plugins/babysitter/hooks/hook-dispatcher.sh on-iteration-start

# Test full orchestration
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/test-run
```

### Verify Hook Priority

```bash
# Create per-repo hook (highest priority)
mkdir -p .a5c/hooks/on-iteration-start
cat > .a5c/hooks/on-iteration-start/custom.sh << 'EOF'
#!/bin/bash
echo '{"action":"custom","message":"Per-repo orchestration active"}'
EOF
chmod +x .a5c/hooks/on-iteration-start/custom.sh

# Run orchestration - should use custom hook
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/test-run
```

## Troubleshooting

### Hooks Not Executing

Check hook permissions:
```bash
find plugins/babysitter/hooks -name "*.sh" ! -executable
```

Make them executable:
```bash
chmod +x plugins/babysitter/hooks/on-iteration-start/*.sh
chmod +x plugins/babysitter/hooks/on-iteration-end/*.sh
```

### Hook Errors

View hook stderr:
```bash
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/test-run 2>&1 | grep "\[.*\]"
```

### Infinite Loops

Check iteration count in hook logs:
```bash
tail -f .a5c/logs/hooks.log | grep "iteration"
```

Use `--max-iterations` to limit:
```bash
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/test-run --max-iterations 10
```

## Future Enhancements

### 1. Hook Composition
Allow hooks to compose results:
```bash
# Hook 1: Filter tasks
# Hook 2: Sort by priority
# Hook 3: Execute top N
```

### 2. Hook State
Share state between hooks:
```bash
# Hook writes to .a5c/runs/<runId>/.hook-state/
# Next hook reads previous decisions
```

### 3. Hook Scheduling
Add scheduling metadata:
```json
{
  "action": "schedule",
  "executeAt": "2026-01-19T20:00:00Z",
  "tasks": ["effect-001"]
}
```

### 4. Hook Debugging
Add debug mode:
```bash
HOOK_DEBUG=1 ./plugins/babysitter/scripts/hook-driven-orchestrate.sh ...
# Shows all hook I/O and decisions
```

## Conclusion

The hook-driven orchestration architecture makes babysitter fully customizable while maintaining backwards compatibility. Users can override orchestration behavior at any level without modifying core code, enabling project-specific workflows, user preferences, and experimentation with different orchestration strategies.
