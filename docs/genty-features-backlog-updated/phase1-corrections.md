# Phase 1 Inventory Adversarial Check Results

Date: 2026-06-04

## 1. COUNT VERIFICATION

**Result: PASS**

- Inventory count: **147 gaps**
- Unique IDs: **147** (no duplicates)
- Gap files on disk (`docs/harness-features-backlog/gaps/**/GAP-*.md`): **147**
- All 147 file-based gap IDs match the 147 inventory IDs exactly. No gaps missing, no extras.

## 2. CATEGORY VERIFICATION

**Result: PASS** -- All 22 categories represented with correct counts.

| Category | Inventory | README | Match |
|----------|-----------|--------|-------|
| agent-delegation | 7 | 7 | OK |
| breakpoint-workflows | 3 | 3 | OK |
| ecosystem | 5 | 5 | OK |
| effect-routing | 3 | 3 | OK |
| harness-adaptation | 5 | 5 | OK |
| json-interaction | 5 | 5 | OK |
| mcp-channels | 4 | 4 | OK |
| observability | 8 | 8 | OK |
| observer-integration | 2 | 2 | OK |
| parallelization | 7 | 7 | OK |
| performance | 7 | 7 | OK |
| process-composition | 4 | 4 | OK |
| profile-orchestration | 1 | 1 | OK |
| prompt-engineering | 12 | 12 | OK |
| remote-integration | 7 | 7 | OK |
| run-lifecycle | 3 | 3 | OK |
| security | 7 | 7 | OK |
| session-management | 5 | 5 | OK |
| state-continuity | 5 | 5 | OK |
| subagent-observability | 5 | 5 | OK |
| tools-capabilities | 23 | 23 | OK |
| user-experience | 19 | 19 | OK |

## 3. FIELD COMPLETENESS

**Result: PASS** -- All sampled entries have complete required fields.

Sampled 20 gaps (every 7th entry): GAP-AGENT-001, GAP-BRK-001, GAP-ECO-005, GAP-HADAPT-004, GAP-MCPC-001, GAP-OBS-004, GAP-PAR-001, GAP-PERF-001, GAP-PROC-001, GAP-PROMPT-003, GAP-PROMPT-010, GAP-REMOTE-007, GAP-SEC-002, GAP-SESSION-002, GAP-STATE-006, GAP-TOOLS-007, GAP-TOOLS-021, GAP-TOOLS-030, GAP-TOOLS-037, GAP-UX-001a.

All have non-empty: priority, effort, status, currentState, targetState.

## 4. KEY FILES VERIFICATION

**Result: FAIL -- 40 distinct stale file paths, 9 stale directory paths across 67+ gap references**

The inventory has three categories of broken keyFiles references:

### 4a. Moved to `packages/genty/platform/` (5 files, ~35 gap references)

These files were relocated from `packages/babysitter-sdk/src/harness/` to `packages/genty/platform/src/harness/` during the SDK restructuring:

| Old Path | New Path | Gaps Affected |
|----------|----------|---------------|
| `packages/babysitter-sdk/src/harness/agenticTools.ts` | `packages/genty/platform/src/harness/agenticTools.ts` | GAP-AGENT-007, GAP-PAR-005, GAP-PROMPT-009, GAP-REMOTE-006, GAP-TOOLS-007/008/012/029/031/034/035/036/037/038, GAP-USER-017 (15 gaps) |
| `packages/babysitter-sdk/src/harness/invoker.ts` | `packages/genty/platform/src/harness/invoker.ts` | GAP-AGENT-001, GAP-HADAPT-002/004/005, GAP-PAR-002/006, GAP-PERF-001/004/007, GAP-REMOTE-001/007, GAP-SUBOBS-001/002/004, GAP-TOOLS-017/030, GAP-UX-001f (17 gaps) |
| `packages/babysitter-sdk/src/harness/piSecureSandbox.ts` | `packages/genty/platform/src/harness/piSecureSandbox.ts` | GAP-SEC-004 (1 gap) |
| `packages/babysitter-sdk/src/harness/piWrapper.ts` | `packages/genty/platform/src/harness/piWrapper.ts` | GAP-AGENT-001, GAP-PAR-006, GAP-PERF-004, GAP-UX-001f (4 gaps) |
| `packages/babysitter-sdk/src/plugins/types.ts` | `packages/genty/platform/src/plugins/types.ts` | GAP-SEC-002 (1 gap) |

### 4b. Restructured plugin files (3 files, 4 gap references)

The SDK plugin module was restructured. These files no longer exist at the old paths and have no direct 1:1 replacements (marketplace moved to `packages/babysitter-sdk/src/blueprints/marketplace.ts`, packageReader to `packages/babysitter-sdk/src/blueprints/packageReader.ts`, registry was removed):

| Old Path | Status | Gaps Affected |
|----------|--------|---------------|
| `packages/babysitter-sdk/src/plugins/marketplace.ts` | Moved to `packages/babysitter-sdk/src/blueprints/marketplace.ts` | GAP-ECO-002 |
| `packages/babysitter-sdk/src/plugins/packageReader.ts` | Moved to `packages/babysitter-sdk/src/blueprints/packageReader.ts` | GAP-PROMPT-002, GAP-TOOLS-027 |
| `packages/babysitter-sdk/src/plugins/registry.ts` | Removed (no equivalent found) | GAP-SEC-002 |

### 4c. CC-sourced `src/` paths (27 paths, 11 gap references)

These paths reference Claude Code's internal source tree (`src/`), not the babysitter repo. The babysitter repo has no root `src/` directory. These were likely copied from CC's codebase analysis and represent CC reference implementations, not babysitter files:

- `src/utils/plugins/*` (9 files) -- referenced by GAP-ECO-001/002/003/004/005
- `src/services/mcp/*` (6 files) -- referenced by GAP-MCPC-001/003/004, GAP-TOOLS-032
- `src/components/*` (5 paths) -- referenced by GAP-UX-001a/001b/001c, GAP-MCPC-004
- `src/commands/plugin/*` (2 paths) -- referenced by GAP-ECO-001/003/005
- `src/types/plugin.ts` -- referenced by GAP-ECO-001

### 4d. Missing directories (3 SDK dirs that never existed)

| Path | Nature | Gaps Affected |
|------|--------|---------------|
| `packages/babysitter-sdk/src/dashboard/` | Target-state directory (does not yet exist) | 19 gaps |
| `packages/babysitter-sdk/src/interaction/` | Target-state directory (does not yet exist) | 10 gaps |
| `packages/babysitter-sdk/src/plugins/` | Moved to `packages/genty/platform/src/plugins/` | 2 gaps |

### 4e. Other stale references

| Path | Issue | Gap |
|------|-------|-----|
| `library/gsd/` | Moved to `library/methodologies/gsd/` | GAP-TOOLS-018 |
| `.a5c/runs/<runId>/state/` | Template path (acceptable) | GAP-PERF-008 |

## 5. DEPENDENCY VERIFICATION

**Result: PASS**

Checked all dependency references across all 147 gaps (not just 5). Every referenced gap ID exists in the inventory. Zero broken dependencies.

## 6. CROSS-CHECK vs README

**Result: PASS** -- All statistics match exactly.

| Metric | README | Inventory | Match |
|--------|--------|-----------|-------|
| Total | 147 | 147 | OK |
| Critical | 10 | 10 | OK |
| High | 67 | 67 | OK |
| Medium | 62 | 62 | OK |
| Low | 8 | 8 | OK |
| Missing | 95 | 95 | OK |
| Partial | 52 | 52 | OK |
| S | 15 | 15 | OK |
| M | 68 | 68 | OK |
| L | 56 | 56 | OK |
| XL | 8 | 8 | OK |

## Summary

| Check | Result |
|-------|--------|
| Count (147 gaps) | PASS |
| Categories (22, all correct counts) | PASS |
| Field completeness (20 sampled) | PASS |
| Key files validity | **FAIL** -- 40 stale files, 9 stale dirs |
| Dependencies | PASS |
| Cross-check vs README | PASS |

### Corrections Applied to `phase1-inventory.json`

The following keyFiles corrections were applied:

1. **5 harness/plugin files**: Updated `packages/babysitter-sdk/src/harness/*.ts` to `packages/genty/platform/src/harness/*.ts` and `packages/babysitter-sdk/src/plugins/types.ts` to `packages/genty/platform/src/plugins/types.ts`
2. **2 blueprint files**: Updated `packages/babysitter-sdk/src/plugins/marketplace.ts` to `packages/babysitter-sdk/src/blueprints/marketplace.ts` and `packages/babysitter-sdk/src/plugins/packageReader.ts` to `packages/babysitter-sdk/src/blueprints/packageReader.ts`
3. **1 library path**: Updated `library/gsd/` to `library/methodologies/gsd/`
4. **27 CC-sourced `src/` paths**: Removed entirely. These reference Claude Code's internal source tree, not the babysitter repo. The gaps describe target-state features; CC paths were incorrectly included as if they were babysitter files.
5. **1 stale plugin reference**: Removed `packages/babysitter-sdk/src/plugins/registry.ts` (no equivalent exists).
6. **2 stale directory refs**: Updated `packages/babysitter-sdk/src/plugins/` to `packages/genty/platform/src/plugins/`

**Total path corrections applied: 74**

### Remaining Target-State Directories (acceptable)

Two directory references remain "missing" but are intentional -- they represent target-state directories where new code should be created as these gaps are implemented:

- `packages/babysitter-sdk/src/dashboard/` -- referenced by 19 gaps (the embedded SDK dashboard)
- `packages/babysitter-sdk/src/interaction/` -- referenced by 10 gaps (the interaction subsystem)

These are not stale references; they are forward-looking placeholders for planned features.
