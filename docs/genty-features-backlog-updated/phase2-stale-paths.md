# Phase 2: Stale Paths Report

Gaps whose Key Files in phase1-inventory.json reference paths that do not exist,
even after the Phase 1b corrections.

## Missing Paths

### `packages/babysitter-sdk/src/dashboard/`

Referenced by: GAP-OBS-001, GAP-OBS-002, GAP-OBS-003, GAP-OBS-005, GAP-OBS-NEW-001,
GAP-OBS-NEW-002, GAP-JSON-005, GAP-PERF-004, GAP-PERF-006, GAP-SUBOBS-001,
GAP-SUBOBS-002, GAP-SUBOBS-003, GAP-SUBOBS-005, GAP-USER-006, GAP-USER-017,
GAP-UX-001, GAP-UX-001d, GAP-UX-001f, GAP-UX-005

**Status:** This directory was never created. The "embedded SDK dashboard" concept
is referenced by 19 gaps but no `packages/babysitter-sdk/src/dashboard/` directory exists.
The functionality it was expected to provide is split between:
- `packages/genty/platform/src/observability/` (health, timeline, runStatus, webhooks)
- `packages/genty/platform/src/api/` (runs, effects, breakpoints, eventStream)
- No terminal UI rendering exists (no Ink/React dependency)

**Recommendation:** Remove this path from all gap definitions. Replace with the
actual genty platform paths where observability and API modules live.

---

### `packages/babysitter-sdk/src/interaction/`

Referenced by: GAP-MCPC-003, GAP-SEC-003, GAP-TOOLS-026, GAP-TOOLS-038,
GAP-UX-001c, GAP-UX-007, GAP-UX-008, GAP-UX-010, GAP-USER-001

**Status:** This directory does not exist in `packages/babysitter-sdk/src/`. The interaction
module lives at `packages/genty/platform/src/interaction/` instead.

**Recommendation:** Update all references from `packages/babysitter-sdk/src/interaction/` to
`packages/genty/platform/src/interaction/`.

---

### `packages/babysitter-sdk/src/processLibrary/` (partial)

Referenced by: GAP-AGENT-004, GAP-PROC-003, GAP-PROMPT-002

**Status:** The directory exists but contains only `active.ts`, `activeTypes.ts`,
and `__tests__/`. There is no `packages/babysitter-sdk/src/processLibrary/` directory with
process templates. The actual process library lives at `library/` (top-level).

**Recommendation:** Update references to point to `library/methodologies/` and
`library/processes/` for template/definition content, keep
`packages/babysitter-sdk/src/processLibrary/` only for the active binding logic.

---

### `.a5c/processes/`

Referenced by: GAP-AGENT-004, GAP-PROC-003, GAP-PROC-004

**Status:** This is a runtime directory created per-project during orchestration.
It is not part of the source tree. The path is valid at runtime but not auditable
in the codebase.

**Recommendation:** Flag as "runtime path" in the inventory rather than "key file".

---

### `.a5c/runs/<runId>/state/`

Referenced by: GAP-PERF-008

**Status:** Runtime directory. Not part of source tree.

**Recommendation:** Flag as "runtime path".

---

## Paths That Moved (already corrected but worth noting)

These paths were corrected in Phase 1b but the underlying code has moved further
into the genty platform layer:

| Inventory Path | Actual Implementation |
|---|---|
| `packages/genty/platform/src/harness/agenticTools.ts` | Now a directory: `packages/genty/platform/src/harness/agenticTools/` with subdirectories (tools/, web/, background/, discovery/, config/, browser/) |
| `packages/babysitter-sdk/src/harness/registry.ts` | Exists, but routing logic is in `packages/genty/platform/src/harness/capabilityRouter.ts` and `selectionPolicies.ts` |

## Summary

| Category | Count |
|---|---|
| Paths that never existed (`sdk/dashboard/`) | 19 gaps affected |
| Paths in wrong package (`sdk/interaction/` -> `genty/platform/interaction/`) | 9 gaps affected |
| Runtime-only paths (`.a5c/`) | 4 gaps affected |
| Directory restructured (agenticTools.ts -> agenticTools/) | Multiple gaps affected |
| Total unique gaps with stale paths | ~30 gaps |
