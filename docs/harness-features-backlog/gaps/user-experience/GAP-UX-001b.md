# GAP-UX-001b: Structured Diff Rendering

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Render file diffs with syntax highlighting, line numbers, and context in the
terminal. Used when displaying task results that involve code changes, journal
event diffs, and run comparison output.

## CC Reference
CC has a full diff rendering system:
- `src/components/diff/DiffDialog.tsx` -- modal diff viewer
- `src/components/diff/DiffFileList.tsx` -- multi-file diff list
- `src/components/diff/DiffDetailView.tsx` -- per-file detail
- `src/components/StructuredDiff.tsx` -- inline structured diff
- `src/components/StructuredDiffList.tsx` -- list of structured diffs
- `src/components/FileEditToolDiff.tsx` -- diff for file edit tool results
- `src/components/FileEditToolUpdatedMessage.tsx` -- post-edit diff message

## Current State
Task results with code changes are stored as raw text in `result.json`. No diff
rendering. No embedded SDK dashboard exists yet. `task:show` outputs the full result
with no diffing.

## Target State
An Ink component `StructuredDiff` that renders unified diffs with:
- Syntax highlighting (via terminal ANSI codes)
- Line numbers
- Added/removed/context lines with color coding
- File path headers
- Collapsible hunks for large diffs

Used by: `task:show` for code-change results, embedded SDK dashboard task detail
view, `run:compare` (GAP-RUN-001) for run diffing.

## Dependencies
- [GAP-UX-001](GAP-UX-001.md) -- Ink rendering foundation
- [GAP-RUN-001](../run-lifecycle/GAP-RUN-001.md) -- run comparison needs diff rendering

## Key Files
| Component | Path |
|-----------|------|
| Task show CLI | `packages/sdk/src/cli/` |
| CC reference | `src/components/diff/` |
| CC reference | `src/components/StructuredDiff.tsx` |

## Recommendation
Use a terminal diff library (e.g., `diff` npm package) for computing diffs.
Render with Ink using green/red coloring. Start with `task:show` output for
agent task results that include file changes.
