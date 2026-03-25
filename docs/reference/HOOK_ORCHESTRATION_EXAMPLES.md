# Hook-Driven Orchestration - Practical Examples

This document provides complete, runnable examples demonstrating different orchestration strategies using hooks.

## Setup

First, ensure you have the babysitter SDK and hooks installed:

```bash
# Verify hook dispatcher exists
ls plugins/babysitter/hooks/hook-dispatcher.sh

# Verify native orchestrator exists
ls plugins/babysitter/hooks/on-iteration-start/native-orchestrator.sh

# Make sure hooks are executable
chmod +x plugins/babysitter/hooks/**/*.sh
```

## Example 1: Default Native Orchestration

The native orchestrator implements standard SDK orchestration via hooks.

### Create a Test Run

```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"

# Create a test process with 3 tasks
cat > /tmp/test-process.js << 'EOF'
import { defineTask } from "@a5c-ai/babysitter-sdk";

const task1 = defineTask("task1", () => ({
  kind: "node",
  title: "Task 1",
  node: { entry: "echo", args: ["Task 1 done"] },
}));

const task2 = defineTask("task2", () => ({
  kind: "node",
  title: "Task 2",
  node: { entry: "echo", args: ["Task 2 done"] },
}));

const task3 = defineTask("task3", () => ({
  kind: "node",
  title: "Task 3",
  node: { entry: "echo", args: ["Task 3 done"] },
}));

export async function testProcess(inputs, ctx) {
  await ctx.task(task1, {});
  await ctx.task(task2, {});
  await ctx.task(task3, {});
  return { status: "completed" };
}
EOF

# Create the run
$CLI run:create \
  --process-id test/native \
  --entry /tmp/test-process.js#testProcess \
  --run-id test-native-$(date +%s)
```

### Orchestrate Using Hooks

```bash
# Use the hook-driven orchestrator
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/test-native-*

# Output:
# [hook-orchestrator] Starting hook-driven orchestration for run: test-native-1768845000
# [hook-orchestrator] ==================== Iteration 1 ====================
# [hook-orchestrator] Invoking on-iteration-start hooks...
# [native-orchestrator] Orchestrating iteration 1 for run test-native-1768845000
# [native-orchestrator] Found 3 auto-runnable node tasks
# [native-orchestrator] Executing task: effect-001
# Task 1 done
# [hook-orchestrator] Hook executed 3 task(s)
# [hook-orchestrator] ==================== Orchestration Complete ====================
```

## Example 2: Simple Sequential Orchestration Override

Create a custom orchestrator that executes tasks one at a time.

### Create Per-Repo Hook

```bash
# Create per-repo hook directory (highest priority)
mkdir -p .a5c/hooks/on-iteration-start

# Create simple sequential orchestrator
cat > .a5c/hooks/on-iteration-start/sequential.sh << 'EOF'
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_ID"

CLI="npx -y @a5c-ai/babysitter-sdk@latest"

echo "[sequential] Executing one task at a time for run $RUN_ID" >&2

# Get first pending task
FIRST_TASK=$($CLI task:list "$RUN_DIR" --pending --json 2>/dev/null | \
  jq -r '.[0].effectId // empty')

if [ -n "$FIRST_TASK" ]; then
  echo "[sequential] Executing task: $FIRST_TASK" >&2
  $CLI task:post "$RUN_DIR" "$FIRST_TASK" --status ok >&2
  echo '{"action":"executed-tasks","count":1,"tasks":["'$FIRST_TASK'"],"strategy":"sequential"}'
else
  echo "[sequential] No pending tasks" >&2
  echo '{"action":"none","reason":"no-tasks"}'
fi
EOF

chmod +x .a5c/hooks/on-iteration-start/sequential.sh
```

### Test Sequential Orchestration

```bash
# Create a new run
$CLI run:create \
  --process-id test/sequential \
  --entry /tmp/test-process.js#testProcess \
  --run-id test-sequential-$(date +%s)

# Orchestrate - will use sequential hook
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/test-sequential-*

# Expected behavior:
# - Iteration 1: Executes task 1 only
# - Iteration 2: Executes task 2 only
# - Iteration 3: Executes task 3 only
# Total: 3 iterations (vs 1 iteration with native orchestrator)
```

## Example 3: Parallel Batch Orchestration

Execute multiple tasks in parallel for faster completion.

### Create Parallel Hook

```bash
cat > .a5c/hooks/on-iteration-start/parallel.sh << 'EOF'
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_ID"

CLI="npx -y @a5c-ai/babysitter-sdk@latest"
BATCH_SIZE=5

echo "[parallel] Executing up to $BATCH_SIZE tasks in parallel for run $RUN_ID" >&2

# Get pending tasks
TASKS=$($CLI task:list "$RUN_DIR" --pending --json 2>/dev/null | \
  jq -r '.[0:'$BATCH_SIZE'] | .[].effectId')

if [ -z "$TASKS" ]; then
  echo "[parallel] No pending tasks" >&2
  echo '{"action":"none","reason":"no-tasks"}'
  exit 0
fi

# Execute tasks in parallel
PIDS=()
TASK_ARRAY=()

for task in $TASKS; do
  echo "[parallel] Starting task: $task" >&2
  $CLI task:post "$RUN_DIR" "$task" --status ok &
  PIDS+=($!)
  TASK_ARRAY+=("$task")
done

# Wait for all tasks
for pid in "${PIDS[@]}"; do
  wait "$pid" || echo "[parallel] Task failed with PID $pid" >&2
done

# Format task array as JSON
TASKS_JSON=$(printf '%s\n' "${TASK_ARRAY[@]}" | jq -R . | jq -s .)

echo "[parallel] Completed ${#PIDS[@]} tasks" >&2
echo '{"action":"executed-tasks","count":'${#PIDS[@]}',"tasks":'$TASKS_JSON',"strategy":"parallel"}'
EOF

chmod +x .a5c/hooks/on-iteration-start/parallel.sh
```

### Test Parallel Orchestration

```bash
# Remove sequential hook to use parallel
rm .a5c/hooks/on-iteration-start/sequential.sh

# Create run
$CLI run:create \
  --process-id test/parallel \
  --entry /tmp/test-process.js#testProcess \
  --run-id test-parallel-$(date +%s)

# Orchestrate in parallel
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/test-parallel-*

# Expected behavior:
# - Iteration 1: Executes all 3 tasks simultaneously
# Total: 1 iteration (faster than sequential)
```

## Example 4: Priority-Based Orchestration

Execute high-priority tasks before low-priority ones.

### Create Process with Priority Metadata

```bash
cat > /tmp/priority-process.js << 'EOF'
import { defineTask } from "@a5c-ai/babysitter-sdk";

const lowPriorityTask = defineTask("low", () => ({
  kind: "node",
  title: "Low Priority Task",
  metadata: { priority: 1 },
  node: { entry: "echo", args: ["Low priority executed"] },
}));

const mediumPriorityTask = defineTask("medium", () => ({
  kind: "node",
  title: "Medium Priority Task",
  metadata: { priority: 5 },
  node: { entry: "echo", args: ["Medium priority executed"] },
}));

const highPriorityTask = defineTask("high", () => ({
  kind: "node",
  title: "High Priority Task",
  metadata: { priority: 10 },
  node: { entry: "echo", args: ["High priority executed"] },
}));

export async function priorityProcess(inputs, ctx) {
  // Note: Tasks are declared in LOW -> HIGH order
  // Priority orchestrator should execute HIGH -> LOW
  await ctx.task(lowPriorityTask, {});
  await ctx.task(mediumPriorityTask, {});
  await ctx.task(highPriorityTask, {});
  return { status: "completed" };
}
EOF
```

### Create Priority Hook

```bash
cat > .a5c/hooks/on-iteration-start/priority.sh << 'EOF'
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_ID"

CLI="npx -y @a5c-ai/babysitter-sdk@latest"

echo "[priority] Finding highest priority task for run $RUN_ID" >&2

# Get pending tasks sorted by priority (highest first)
HIGH_PRIORITY_TASK=$($CLI task:list "$RUN_DIR" --pending --json 2>/dev/null | \
  jq -r 'map({effectId, priority: (.metadata.priority // 0)}) |
         sort_by(.priority) | reverse | .[0].effectId // empty')

if [ -n "$HIGH_PRIORITY_TASK" ]; then
  PRIORITY=$($CLI task:show "$RUN_DIR" "$HIGH_PRIORITY_TASK" --json 2>/dev/null | \
    jq -r '.metadata.priority // "unknown"')

  echo "[priority] Executing task $HIGH_PRIORITY_TASK (priority: $PRIORITY)" >&2
  $CLI task:post "$RUN_DIR" "$HIGH_PRIORITY_TASK" --status ok >&2

  echo '{"action":"executed-tasks","count":1,"tasks":["'$HIGH_PRIORITY_TASK'"],"priority":'$PRIORITY',"strategy":"priority"}'
else
  echo "[priority] No pending tasks" >&2
  echo '{"action":"none","reason":"no-tasks"}'
fi
EOF

chmod +x .a5c/hooks/on-iteration-start/priority.sh
```

### Test Priority Orchestration

```bash
# Create run
$CLI run:create \
  --process-id test/priority \
  --entry /tmp/priority-process.js#priorityProcess \
  --run-id test-priority-$(date +%s)

# Orchestrate by priority
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/test-priority-*

# Expected output order:
# 1. High priority executed (priority: 10)
# 2. Medium priority executed (priority: 5)
# 3. Low priority executed (priority: 1)
```

## Example 5: Conditional Strategy Selection

Choose orchestration strategy based on run metadata.

### Create Adaptive Hook

```bash
cat > .a5c/hooks/on-iteration-start/adaptive.sh << 'EOF'
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_ID"

# Read orchestration strategy from run metadata
STRATEGY=$(jq -r '.metadata.orchestrationStrategy // "sequential"' \
  "$RUN_DIR/run.json")

echo "[adaptive] Selected strategy: $STRATEGY for run $RUN_ID" >&2

# Delegate to appropriate strategy hook
case "$STRATEGY" in
  parallel)
    exec .a5c/hooks/on-iteration-start/parallel.sh
    ;;
  priority)
    exec .a5c/hooks/on-iteration-start/priority.sh
    ;;
  sequential|*)
    exec .a5c/hooks/on-iteration-start/sequential.sh
    ;;
esac
EOF

chmod +x .a5c/hooks/on-iteration-start/adaptive.sh

# Remove other hooks so adaptive is used
rm -f .a5c/hooks/on-iteration-start/{sequential,parallel,priority}.sh
```

### Test Adaptive Orchestration

```bash
# Create run with parallel strategy
$CLI run:create \
  --process-id test/adaptive \
  --entry /tmp/test-process.js#testProcess \
  --run-id test-adaptive-parallel-$(date +%s) \
  --metadata '{"orchestrationStrategy":"parallel"}'

# Orchestrate - will use parallel strategy
./plugins/babysitter/scripts/hook-driven-orchestrate.sh \
  .a5c/runs/test-adaptive-parallel-*

# Create another run with sequential strategy
$CLI run:create \
  --process-id test/adaptive \
  --entry /tmp/test-process.js#testProcess \
  --run-id test-adaptive-sequential-$(date +%s) \
  --metadata '{"orchestrationStrategy":"sequential"}'

# Orchestrate - will use sequential strategy
./plugins/babysitter/scripts/hook-driven-orchestrate.sh \
  .a5c/runs/test-adaptive-sequential-*
```

## Example 6: Rate-Limited Orchestration

Prevent overwhelming external systems with rate limiting.

### Create Rate-Limited Hook

```bash
cat > .a5c/hooks/on-iteration-start/rate-limited.sh << 'EOF'
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
RUN_DIR=".a5c/runs/$RUN_ID"
RATE_LIMIT_FILE="$RUN_DIR/.rate-limit"
MIN_INTERVAL=5  # Minimum 5 seconds between executions

CLI="npx -y @a5c-ai/babysitter-sdk@latest"

echo "[rate-limit] Checking rate limit for run $RUN_ID" >&2

# Check last execution time
if [ -f "$RATE_LIMIT_FILE" ]; then
  LAST_EXEC=$(cat "$RATE_LIMIT_FILE")
  CURRENT_TIME=$(date +%s)
  TIME_DIFF=$((CURRENT_TIME - LAST_EXEC))

  if [ $TIME_DIFF -lt $MIN_INTERVAL ]; then
    WAIT_TIME=$((MIN_INTERVAL - TIME_DIFF))
    echo "[rate-limit] Rate limit active, need to wait ${WAIT_TIME}s" >&2
    echo '{"action":"waiting","reason":"rate-limit","waitSeconds":'$WAIT_TIME'}'
    exit 0
  fi
fi

# Execute one task
TASK=$($CLI task:list "$RUN_DIR" --pending --json 2>/dev/null | \
  jq -r '.[0].effectId // empty')

if [ -n "$TASK" ]; then
  echo "[rate-limit] Executing task: $TASK" >&2
  $CLI task:post "$RUN_DIR" "$TASK" --status ok >&2

  # Update rate limit timestamp
  date +%s > "$RATE_LIMIT_FILE"

  echo '{"action":"executed-tasks","count":1,"tasks":["'$TASK'"],"rateLimited":true}'
else
  echo '{"action":"none","reason":"no-tasks"}'
fi
EOF

chmod +x .a5c/hooks/on-iteration-start/rate-limited.sh
```

### Test Rate-Limited Orchestration

```bash
# Create run
$CLI run:create \
  --process-id test/rate-limited \
  --entry /tmp/test-process.js#testProcess \
  --run-id test-rate-limited-$(date +%s)

# Orchestrate with rate limiting
# Watch timestamps to verify 5-second delays
./plugins/babysitter/scripts/hook-driven-orchestrate.sh \
  .a5c/runs/test-rate-limited-* 2>&1 | grep -E "\[.*\]"

# Expected behavior:
# - Task 1 executes immediately
# - Wait 5 seconds
# - Task 2 executes
# - Wait 5 seconds
# - Task 3 executes
```

## Comparison Table

| Strategy | Iterations | Speed | Use Case |
|----------|-----------|-------|----------|
| Native (batch) | 1 | Fast | Default SDK behavior, up to 5 tasks at once |
| Sequential | 3 | Slow | Debugging, dependencies between tasks |
| Parallel | 1 | Fastest | Independent tasks, maximize throughput |
| Priority | 3 | Slow | Critical tasks first, controlled execution |
| Adaptive | Varies | Varies | Multi-tenant, per-run configuration |
| Rate-Limited | 3+ | Slowest | API rate limits, resource protection |

## Troubleshooting

### Hooks Not Running

Check that hooks are executable and discoverable:

```bash
# List all hooks
find .a5c/hooks -name "*.sh" -type f

# Check if executable
find .a5c/hooks -name "*.sh" ! -executable

# Make executable
chmod +x .a5c/hooks/**/*.sh
```

### Wrong Hook Being Used

Check hook priority (per-repo > per-user > plugin):

```bash
# See which hooks are discovered
echo '{"runId":"test","iteration":1,"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' | \
  plugins/babysitter/hooks/hook-dispatcher.sh on-iteration-start 2>&1 | \
  grep "Running:"
```

### Hook Errors

Enable verbose output:

```bash
# Run with stderr visible
./plugins/babysitter/scripts/hook-driven-orchestrate.sh \
  .a5c/runs/test-run 2>&1 | less

# Check hook logs
tail -f .a5c/logs/hooks.log
```

## Next Steps

1. **Experiment**: Try different strategies with your processes
2. **Customize**: Create project-specific orchestration logic
3. **Compose**: Combine multiple strategies (e.g., priority + rate-limiting)
4. **Monitor**: Add metrics collection to orchestration hooks
5. **Optimize**: Profile and tune orchestration performance

## Further Reading

- `HOOK_DRIVEN_ORCHESTRATION.md` - Architecture details
- `HOOKS.md` - Complete hook reference
- `sdk.md` - SDK documentation
