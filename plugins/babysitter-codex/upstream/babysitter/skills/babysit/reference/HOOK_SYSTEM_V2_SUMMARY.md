# Hook System v2.0 - Generalized Hook Architecture

**Date:** 2026-01-19
**Status:** ✅ Complete
**Todo:** #4 - Generalize hook system

---

## What's New in v2.0

The hook system has been generalized to support lifecycle hooks throughout the orchestration pipeline and process-level hooks callable from `main.js` files.

### Key Improvements

1. **Generic Hook Dispatcher** - Single dispatcher handles all hook types
2. **SDK Integration** - Call hooks from process files via `ctx.hook()`
3. **12 Hook Types** - 8 SDK lifecycle + 4 process-level hooks
4. **Backwards Compatible** - Existing on-breakpoint hooks work unchanged
5. **TypeScript Support** - Full type definitions for hook payloads

---

## New Hook Types

### SDK Lifecycle Hooks (Automatic)

These are automatically triggered by the SDK runtime:

- **`on-run-start`** - Run created, before first step
- **`on-run-complete`** - Run finished successfully
- **`on-run-fail`** - Run failed with error
- **`on-task-start`** - Task begins execution
- **`on-task-complete`** - Task completes
- **`on-step-dispatch`** - After each orchestration step
- **`on-iteration-start`** - Start of orchestration iteration
- **`on-iteration-end`** - End of orchestration iteration

### Process-Level Hooks (Manual)

These are called explicitly from process files:

- **`on-breakpoint`** - User approval/input required (existing)
- **`pre-commit`** - Before committing changes
- **`pre-branch`** - Before creating branch
- **`post-planning`** - After planning phase complete
- **`on-score`** - Scoring/evaluation step

---

## Usage Examples

### From Process Files (main.js)

```javascript
import { defineTask } from "@a5c-ai/babysitter-sdk";

export async function myProcess(inputs, ctx) {
  // Call pre-commit hooks
  const commitResult = await ctx.hook("pre-commit", {
    files: ["src/feature.ts"],
    message: "feat: add feature",
  });

  // Call scoring hooks
  await ctx.hook("on-score", {
    target: "code-quality",
    score: 85,
    metrics: { coverage: 92 },
  });

  return { ok: true };
}
```

### From Shell

```bash
# Using generic dispatcher
echo '{"runId":"run-123","status":"completed"}' | \
  plugins/babysitter/hooks/hook-dispatcher.sh on-run-complete
```

---

## File Structure

```
plugins/babysitter/hooks/
├── hook-dispatcher.sh              ← Generic dispatcher (all types)
├── on-breakpoint-dispatcher.sh     ← Kept for backwards compat
├── on-run-start/
│   └── logger.sh                   ← Default logger
├── on-run-complete/
│   ├── logger.sh
│   └── notify.sh.example
├── on-run-fail/
│   └── logger.sh
├── on-task-start/
│   └── logger.sh
├── on-task-complete/
│   ├── logger.sh
│   └── metrics.sh.example
├── on-step-dispatch/
│   └── logger.sh
├── on-iteration-start/
│   └── logger.sh
├── on-iteration-end/
│   └── logger.sh
├── pre-commit/
│   └── logger.sh
├── pre-branch/
│   └── logger.sh
├── post-planning/
│   └── logger.sh
└── on-score/
    └── logger.sh

packages/sdk/src/hooks/
├── index.ts                         ← Public API
├── types.ts                         ← TypeScript types
└── dispatcher.ts                    ← Node.js dispatcher
```

---

## Default Hooks

Every hook type includes a `logger.sh` that logs events to `.a5c/logs/hooks.log`.

**Example hooks** provided as `.example` files:
- `on-run-complete/notify.sh.example` - Notification templates
- `on-task-complete/metrics.sh.example` - Metrics collection

---

## Common Use Cases

### Notifications on Run Complete

```bash
#!/bin/bash
# .a5c/hooks/on-run-complete/slack.sh
PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
curl -X POST "$SLACK_WEBHOOK" \
  -d "{\"text\":\"Run $RUN_ID completed\"}"
```

### Task Metrics Collection

```bash
#!/bin/bash
# .a5c/hooks/on-task-complete/metrics.sh
PAYLOAD=$(cat)
DURATION=$(echo "$PAYLOAD" | jq -r '.duration')
echo "$(date),$DURATION" >> .a5c/logs/metrics.csv
```

### Pre-Commit Linting

```bash
#!/bin/bash
# .a5c/hooks/pre-commit/eslint.sh
PAYLOAD=$(cat)
FILES=$(echo "$PAYLOAD" | jq -r '.files[]')
npx eslint $FILES
```

---

## SDK Integration

### ProcessContext.hook() Method

```typescript
interface ProcessContext {
  hook(
    hookType: string,
    payload: Record<string, unknown>,
    options?: {
      label?: string;
      timeout?: number;
      throwOnFailure?: boolean;
    }
  ): Promise<HookResult>;
}
```

### Hook Result

```typescript
interface HookResult {
  hookType: string;
  success: boolean;
  output?: unknown;
  error?: string;
  executedHooks: HookExecutionResult[];
}
```

---

## Payload Schemas

All payloads include:
- `hookType` - The hook type
- `runId` - The run ID (when available)
- `timestamp` - ISO 8601 timestamp (auto-added)

### on-run-start

```json
{
  "hookType": "on-run-start",
  "runId": "run-20260119-example",
  "processId": "dev/build",
  "entry": ".a5c/processes/.../build.js#fullBuild",
  "inputs": {},
  "timestamp": "2026-01-19T12:00:00Z"
}
```

### on-task-complete

```json
{
  "hookType": "on-task-complete",
  "runId": "run-20260119-example",
  "effectId": "ef-abc-123",
  "taskId": "build-project",
  "status": "ok",
  "result": {},
  "duration": 5000,
  "timestamp": "2026-01-19T12:01:05Z"
}
```

### pre-commit

```json
{
  "hookType": "pre-commit",
  "runId": "run-20260119-example",
  "files": ["src/foo.ts", "src/bar.ts"],
  "message": "feat: add feature",
  "author": "Claude",
  "timestamp": "2026-01-19T12:03:00Z"
}
```

---

## Benefits

✅ **Extensible** - Easy to add new hook types
✅ **Consistent** - All hooks follow same pattern
✅ **Flexible** - Callable from SDK or processes
✅ **Discoverable** - Same discovery mechanism (per-repo, per-user, plugin)
✅ **Composable** - Multiple hooks per event
✅ **Backwards compatible** - Existing hooks work unchanged
✅ **Type-safe** - Full TypeScript support
✅ **Well-documented** - Comprehensive examples and guides

---

## Migration from v1.0

### Existing Hooks

All existing `on-breakpoint` hooks continue to work:

```bash
# Old dispatcher (still works)
plugins/babysitter/hooks/on-breakpoint-dispatcher.sh

# New dispatcher (also works)
plugins/babysitter/hooks/hook-dispatcher.sh on-breakpoint
```

### New Hook Creation

Create hooks for new lifecycle events:

```bash
mkdir -p .a5c/hooks/on-run-complete
cat > .a5c/hooks/on-run-complete/notify.sh << 'EOF'
#!/bin/bash
# Your hook implementation
EOF
chmod +x .a5c/hooks/on-run-complete/notify.sh
```

---

## See Also

- [HOOKS.md](./HOOKS.md) - Complete hook system documentation
- [Hook Implementation](./HOOK_IMPLEMENTATION_2026-01-19.md) - Original on-breakpoint implementation
- [Architecture Simplification](./ARCHITECTURE_SIMPLIFICATION_2026-01-19.md) - Skill consolidation
- [Babysitter Skill](../../.claude/skills/babysit/SKILL.md) - Skill instructions with hook examples

---

**Version:** 2.0
**Status:** Production Ready
**Implementation Date:** 2026-01-19
