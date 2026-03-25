# Hook-Driven Orchestration - Implementation Summary

**Date:** 2026-01-19
**Version:** 3.0 - Hook-Driven Architecture

## What Was Built

Transformed the babysitter orchestration system to be **hook-driven**, where orchestration logic lives in hooks rather than CLI commands. This makes the entire orchestration system fully customizable without code changes.

## Architecture Transformation

### Before: CLI-Driven

```
CLI Command
  └─> Contains orchestration logic
  └─> Calls SDK directly
  └─> Triggers hooks as observers
```

**Problem:** Orchestration logic is hard-coded in CLI/SDK. Customization requires modifying TypeScript code, recompiling, and reinstalling.

### After: Hook-Driven

```
CLI Command
  └─> Calls on-iteration-start hook
      └─> Hook analyzes run state
      └─> Hook calls CLI commands (task:post, etc.)
      └─> Hook returns orchestration decision
  └─> CLI executes decision
  └─> Calls on-iteration-end hook
      └─> Hook determines if more iterations needed
```

**Solution:** Orchestration logic lives in shell scripts. Customization is as simple as adding a `.sh` file.

## Components Created

### 1. Native Orchestrator Hook
**File:** `plugins/babysitter/hooks/on-iteration-start/native-orchestrator.sh`

Implements default SDK orchestration via hooks:
- Analyzes run status and pending effects
- Executes auto-runnable node tasks (up to 3 per iteration)
- Handles breakpoints and sleep effects
- Returns orchestration decision as JSON

### 2. Native Finalization Hook
**File:** `plugins/babysitter/hooks/on-iteration-end/native-finalization.sh`

Post-iteration logic via hooks:
- Checks final iteration status
- Counts remaining pending effects
- Determines if more iterations are needed
- Returns continuation decision as JSON

### 3. Hook-Driven Orchestration Script
**File:** `plugins/babysitter/scripts/hook-driven-orchestrate.sh`

CLI wrapper that delegates to hooks:
- Loops until terminal state
- Calls hooks for each iteration
- Executes hook decisions
- Supports `--max-iterations` safety limit

### 4. Example Orchestration Overrides
**File:** `plugins/babysitter/hooks/on-iteration-start/orchestrator.sh.example`

Demonstrates custom orchestration strategies:
- Simple sequential (one task per iteration)
- Parallel batch (multiple tasks simultaneously)
- Priority-based (high-priority tasks first)

### 5. Comprehensive Documentation

**HOOK_DRIVEN_ORCHESTRATION.md** - Architecture guide
- Benefits and design principles
- Hook contract specifications
- Migration path
- Testing and troubleshooting

**HOOK_ORCHESTRATION_EXAMPLES.md** - Practical examples
- 6 complete, runnable examples
- Sequential, parallel, priority, adaptive, rate-limited
- Comparison table and troubleshooting

## Key Features

### 1. Full Customization
Override at any level:
- **Per-repo** (`.a5c/hooks/`) - Project-specific logic
- **Per-user** (`~/.config/babysitter/hooks/`) - User preferences
- **Plugin** (`plugins/babysitter/hooks/`) - Defaults

### 2. No Code Changes
Replace orchestration without modifying SDK:
- Add a shell script
- No TypeScript compilation
- No npm install
- Works immediately

### 3. Composable
Multiple hooks contribute to decisions:
- Hook 1: Filter tasks by labels
- Hook 2: Sort by priority
- Hook 3: Apply rate limiting
- Hook 4: Execute selected tasks

### 4. Easy Testing
Test strategies independently:
```bash
# Test hook directly
echo '{"runId":"test","iteration":1}' | \
  .a5c/hooks/on-iteration-start/my-strategy.sh

# Test full orchestration
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/test-run
```

## Example: Simple Sequential Override

Create `.a5c/hooks/on-iteration-start/sequential.sh`:

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')

# Execute just ONE task per iteration
TASK=$(npx -y @a5c-ai/babysitter-sdk@latest task:list ".a5c/runs/$RUN_ID" \
  --pending --json | jq -r '.[0].effectId // empty')

if [ -n "$TASK" ]; then
  npx -y @a5c-ai/babysitter-sdk@latest task:post ".a5c/runs/$RUN_ID" "$TASK" --status ok
  echo '{"action":"executed-tasks","count":1,"tasks":["'$TASK'"]}'
else
  echo '{"action":"none","reason":"no-tasks"}'
fi
```

**Result:** Orchestrator now executes tasks one at a time instead of in batches.

## Example: Parallel Override

Create `.a5c/hooks/on-iteration-start/parallel.sh`:

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')

# Get up to 5 tasks
TASKS=$(npx -y @a5c-ai/babysitter-sdk@latest task:list ".a5c/runs/$RUN_ID" \
  --pending --json | jq -r '.[0:5] | .[].effectId')

# Execute ALL in parallel
for task in $TASKS; do
  npx -y @a5c-ai/babysitter-sdk@latest task:post ".a5c/runs/$RUN_ID" "$task" --status ok &
done

wait  # Wait for all tasks

echo '{"action":"executed-tasks","count":'$(echo "$TASKS" | wc -l)'}'
```

**Result:** All tasks execute simultaneously for maximum speed.

## Hook Contract

### on-iteration-start

**Input:**
```json
{
  "runId": "run-20260119-example",
  "iteration": 5,
  "timestamp": "2026-01-19T18:00:00Z"
}
```

**Output:**
```json
{
  "action": "executed-tasks",
  "count": 3,
  "tasks": ["effect-001", "effect-002", "effect-003"]
}
```

**Actions:**
- `executed-tasks` - Executed one or more tasks
- `waiting` - Should wait (breakpoint, sleep, etc.)
- `none` - No action (terminal state, no pending effects)

### on-iteration-end

**Input:**
```json
{
  "runId": "run-20260119-example",
  "iteration": 5,
  "status": "waiting",
  "timestamp": "2026-01-19T18:00:00Z"
}
```

**Output:**
```json
{
  "iteration": 5,
  "finalStatus": "waiting",
  "pendingEffects": 2,
  "needsMoreIterations": true
}
```

## Use Cases

### 1. Debugging Workflows
**Problem:** Need to step through tasks one by one
**Solution:** Use sequential orchestrator

### 2. CI/CD Optimization
**Problem:** Independent tests should run in parallel
**Solution:** Use parallel orchestrator

### 3. API Rate Limiting
**Problem:** External API has rate limits
**Solution:** Use rate-limited orchestrator

### 4. Priority Execution
**Problem:** Critical tasks should run first
**Solution:** Use priority-based orchestrator

### 5. Multi-Tenant Systems
**Problem:** Different projects need different strategies
**Solution:** Use adaptive orchestrator that reads run metadata

### 6. Resource Management
**Problem:** Limited compute resources
**Solution:** Create custom orchestrator that checks resource availability

## Testing the System

### 1. Test Native Orchestrator

```bash
# Create a test run
CLI="npx -y @a5c-ai/babysitter-sdk@latest"
$CLI run:create --process-id test/hook \
  --entry /tmp/test-process.js#testProcess \
  --run-id test-hook-$(date +%s)

# Orchestrate using hooks
./plugins/babysitter/scripts/hook-driven-orchestrate.sh \
  .a5c/runs/test-hook-*
```

### 2. Test Custom Orchestrator

```bash
# Create custom hook
mkdir -p .a5c/hooks/on-iteration-start
cat > .a5c/hooks/on-iteration-start/my-strategy.sh << 'EOF'
#!/bin/bash
# Your custom orchestration logic here
echo '{"action":"executed-tasks","count":1}'
EOF
chmod +x .a5c/hooks/on-iteration-start/my-strategy.sh

# Test it
./plugins/babysitter/scripts/hook-driven-orchestrate.sh \
  .a5c/runs/test-hook-*
```

### 3. Verify Hook Priority

```bash
# Hooks execute in priority order:
# 1. Per-repo (.a5c/hooks/)
# 2. Per-user (~/.config/babysitter/hooks/)
# 3. Plugin (plugins/babysitter/hooks/)

# Create per-repo hook to override
cat > .a5c/hooks/on-iteration-start/override.sh << 'EOF'
#!/bin/bash
echo '{"action":"custom","message":"Per-repo override active"}'
EOF
chmod +x .a5c/hooks/on-iteration-start/override.sh

# This hook will execute INSTEAD of plugin hooks
```

## Benefits Over Traditional Approach

| Aspect | Traditional (Before) | Hook-Driven (Now) |
|--------|---------------------|-------------------|
| **Customization** | Modify TypeScript code | Add shell script |
| **Deployment** | Recompile & reinstall | Copy file |
| **Testing** | Unit tests + integration | Direct script execution |
| **Per-project** | Not possible | `.a5c/hooks/` directory |
| **Per-user** | Not possible | `~/.config/` directory |
| **Debugging** | Debug TypeScript | Debug shell script |
| **Experimentation** | Fork SDK repo | Try different hooks |
| **Composition** | Complex code changes | Chain hook scripts |

## Migration Path

### Phase 1: Coexistence (Current)
- ✅ Traditional CLI commands work unchanged
- ✅ Hook-driven script available as alternative
- ✅ Users can test and compare

### Phase 2: Adoption
- Migrate projects to hook-driven orchestration
- Share common orchestration hooks
- Build hook library for common patterns

### Phase 3: Default (Future)
- Make hook-driven orchestration the default
- Traditional mode available as fallback
- Deprecate direct orchestration in CLI

## Files Created

```
plugins/babysitter/
├── hooks/
│   ├── on-iteration-start/
│   │   ├── native-orchestrator.sh          (Default SDK orchestration)
│   │   └── orchestrator.sh.example         (Custom strategies)
│   └── on-iteration-end/
│       └── native-finalization.sh          (Post-iteration logic)
├── scripts/
│   └── hook-driven-orchestrate.sh          (Hook-driven CLI wrapper)
├── HOOK_DRIVEN_ORCHESTRATION.md            (Architecture documentation)
├── HOOK_ORCHESTRATION_EXAMPLES.md          (Practical examples)
└── HOOK_ORCHESTRATION_SUMMARY.md           (This file)
```

## Quick Start

1. **Use default orchestration:**
```bash
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/<runId>
```

2. **Create custom orchestration:**
```bash
# Copy example
cp plugins/babysitter/hooks/on-iteration-start/orchestrator.sh.example \
   .a5c/hooks/on-iteration-start/my-strategy.sh

# Edit strategy
vim .a5c/hooks/on-iteration-start/my-strategy.sh

# Make executable
chmod +x .a5c/hooks/on-iteration-start/my-strategy.sh

# Use it
./plugins/babysitter/scripts/hook-driven-orchestrate.sh .a5c/runs/<runId>
```

3. **Test different strategies:**
```bash
# Sequential
ORCHESTRATION_STRATEGY=sequential ./plugins/babysitter/scripts/hook-driven-orchestrate.sh ...

# Parallel
ORCHESTRATION_STRATEGY=parallel ./plugins/babysitter/scripts/hook-driven-orchestrate.sh ...

# Priority
ORCHESTRATION_STRATEGY=priority ./plugins/babysitter/scripts/hook-driven-orchestrate.sh ...
```

## Conclusion

The hook-driven orchestration architecture provides unprecedented flexibility while maintaining backwards compatibility. Users can now customize every aspect of orchestration behavior through simple shell scripts, enabling:

- **Project-specific workflows** - Each repo can define its orchestration strategy
- **User preferences** - Individual developers can customize behavior
- **Experimentation** - Try different strategies without code changes
- **Composability** - Combine multiple strategies
- **Observability** - Hook logs provide full orchestration visibility

The system is production-ready with working examples, comprehensive documentation, and tested implementations.
