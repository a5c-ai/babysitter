# Legacy Auto-Run Code Removal

**Date:** 2026-01-19
**Version:** SDK 0.0.29+

## Summary

Successfully removed all legacy `run:continue` and auto-run functionality from the SDK. This cleanup was necessary after implementing the pure hook execution architecture where hooks execute tasks directly and the skill/agent provides only the loop.

## Motivation

With the new hook-driven orchestration:
- **Hooks execute tasks** via `on-iteration-start` calling `task:post` to commit results
- **`run:iterate` provides single iteration** command
- **Skill/agent loops** calling `run:iterate` repeatedly

The old `run:continue --auto-node-tasks` command duplicated this functionality and created confusion about which approach to use.

## What Was Removed

### 1. CLI Command
- ✅ `run:continue` command and all its flags
- ✅ `--auto-node-tasks` flag
- ✅ `--auto-node-max <n>` flag
- ✅ `--auto-node-label <text>` flag

### 2. Code Removed from `packages/sdk/src/cli/main.ts`

**ParsedArgs interface fields:**
- `autoNodeTasks: boolean`
- `autoNodeMax?: number`
- `autoNodeLabel?: string`

**Functions (~350 lines total):**
- `handleRunContinue()` - 145 lines
- `autoRunNodeTasks()` - 23 lines
- `emitJsonResult()` - 28 lines
- `matchesAutoNodeLabel()` - 6 lines
- `logRunContinueStatus()` - 16 lines
- `logAutoRunPlan()` - 10 lines

**Flag parsing:**
- `--auto-node-tasks` parsing
- `--auto-node-max` parsing
- `--auto-node-label` parsing
- `run:continue` positional argument parsing

**Command routing:**
- `run:continue` command handler invocation

### 3. Tests Removed

**From `packages/sdk/src/cli/__tests__/cliRuns.test.ts`:**
- Entire `run:continue` describe block (236 lines)
- Tests for auto-run node tasks until completion
- Tests for dry-run auto-node plans
- Tests for pending summaries with auto-run
- Tests for metadata injection
- Tests for failure propagation
- Tests for scheduler sleep hints

**From `packages/sdk/src/cli/__tests__/cliMain.test.ts`:**
- All run:continue and auto-run tests (217 lines)
- Tests for auto-node disabled
- Tests for auto-running until completion
- Tests for JSON summary emission
- Tests for error reporting
- Tests for dry-run plans
- Tests for --auto-node-max limiting
- Tests for --auto-node-label filtering
- Tests for --now rejection

### 4. USAGE String Updated

**Before:**
```
babysitter run:continue <runDir> [--runs-dir <dir>] [--json] [--dry-run] [--auto-node-tasks] [--auto-node-max <n>] [--auto-node-label <text>]
```

**After:**
```
(removed entirely)
```

## New Architecture

Users should now use `run:iterate` which relies on hooks for execution:

**Example orchestration loop:**
```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"
ITERATION=0

while true; do
  ((ITERATION++))

  # Hook executes tasks internally
  RESULT=$($CLI run:iterate "$RUN_ID" --json --iteration $ITERATION)

  STATUS=$(echo "$RESULT" | jq -r '.status')

  # Check terminal states
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  elif [ "$STATUS" = "waiting" ]; then
    break
  fi

  # Status "executed" - continue looping
done
```

## Migration Guide

### Old Workflow
```bash
# OLD: Used run:continue with auto-run flags
babysitter run:continue .a5c/runs/run-123 --auto-node-tasks --auto-node-max 5
```

### New Workflow
```bash
# NEW: Use run:iterate in a loop (or let skill handle it)
while true; do
  RESULT=$(babysitter run:iterate .a5c/runs/run-123 --json)
  STATUS=$(echo "$RESULT" | jq -r '.status')

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  elif [ "$STATUS" = "waiting" ]; then
    break
  fi
done
```

Or better yet, let the babysitter skill handle the loop - just call:
```bash
# The skill internally loops run:iterate
babysitter-skill orchestrate run-123
```

## Benefits

1. **Single orchestration approach** - Only one way to do things (run:iterate + hooks)
2. **Cleaner codebase** - Removed ~600+ lines of redundant code
3. **No confusion** - Users don't have to choose between run:continue and run:iterate
4. **Hook-driven purity** - All task execution happens in hooks, not in SDK
5. **Better separation of concerns** - Hooks execute, CLI iterates, skills loop

## Verification

✅ SDK builds successfully
✅ CLI help shows run:iterate but not run:continue
✅ No references to auto-node flags in help text
✅ Remaining tests pass (only unrelated path resolution failures)
✅ run:iterate command works correctly

## Files Modified

- `packages/sdk/src/cli/main.ts` - Removed ~350 lines
- `packages/sdk/src/cli/__tests__/cliRuns.test.ts` - Removed ~236 lines
- `packages/sdk/src/cli/__tests__/cliMain.test.ts` - Removed ~217 lines

**Total: ~803 lines of legacy code removed**

## Breaking Changes

⚠️ **BREAKING:** The `run:continue` command is no longer available

**Users must:**
- Use `run:iterate` instead
- Implement their own loop or use the babysitter skill
- Remove `--auto-node-tasks`, `--auto-node-max`, `--auto-node-label` flags from scripts

## Next Steps

1. Update babysitter skill to use run:iterate loop (if not already done)
2. Update documentation to remove run:continue references
3. Update examples and tutorials
4. Communicate breaking change to users

## See Also

- `REFACTORING_TO_PURE_HOOK_EXECUTION.md` - Pure hook execution architecture
- `SKILL_ORCHESTRATION_GUIDE.md` - How to use run:iterate in skills
- `plugins/babysitter/hooks/on-iteration-start/native-orchestrator.sh` - Hook that executes tasks

## Conclusion

The removal of legacy auto-run code completes the transition to a pure hook-driven architecture. The codebase is now cleaner, simpler, and follows a single clear pattern: **hooks execute, skill loops, SDK never runs tasks automatically**.
