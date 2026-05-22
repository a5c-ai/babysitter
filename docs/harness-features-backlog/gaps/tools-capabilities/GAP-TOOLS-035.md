# GAP-TOOLS-035: Grep Output Modes and Context Params

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | S |
| Status | Missing |

## Description
Enhance babysitter's `grep` agentic tool to match CC's GrepTool feature set:
output mode selection, separate before/after context lines, and line number toggle.

## Current State
Babysitter's `grep` tool (in `agenticTools.ts`) wraps ripgrep with these params:
`pattern`, `path`, `glob`, `type`, `i` (case-insensitive), `context` (lines around
match), `limit`, `offset`, `multiline`.

Always returns matching lines with line numbers. No way to request file paths only,
match counts, or separate before/after context.

## Target State
Add these params to the `grep` agentic tool:

- **`output_mode`**: `'content'` (matching lines, current behavior), `'files_with_matches'`
  (file paths only -- maps to `rg -l`), `'count'` (match counts per file -- maps to
  `rg -c`). Default: `'files_with_matches'` (matches CC).
- **`before_context`** (or `-B`): Lines to show before each match (maps to `rg -B`).
- **`after_context`** (or `-A`): Lines to show after each match (maps to `rg -A`).
- **`line_numbers`** (or `-n`): Boolean toggle for line numbers in output. Default true.
  Maps to `rg -n` / `rg --no-line-number`.
- **`head_limit`**: Max output lines/entries. Default 250. Distinct from `limit` which
  currently controls post-processing slice.

Implementation: straightforward ripgrep flag mapping. Each param maps directly to an
`rg` flag. No architectural changes needed.

## Dependencies
- None.

## Key Files
| Component | Path |
|-----------|------|
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| CC GrepTool | `src/tools/GrepTool/GrepTool.ts` |

## Recommendation
Phase 1. Small effort, high value. The `output_mode` param is especially important --
`files_with_matches` mode is CC's default and is critical for codebase exploration.
