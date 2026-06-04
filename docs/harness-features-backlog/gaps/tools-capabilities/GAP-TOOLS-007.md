# GAP-TOOLS-007: JS/TS REPL Tool

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Low |
| Effort | S |
| Status | Missing |

## Description
Interactive JavaScript/TypeScript REPL tool for code evaluation within orchestrated
tasks. CC has `REPLTool` for quick JS/TS evaluation; babysitter has `python` but no
JS/TS equivalent.

## Current State
`agenticTools.ts` provides a `python` tool that spawns a Python subprocess. No JS/TS
REPL. Agents needing JS evaluation must use `bash` with `node -e`.

## Target State
A `js_repl` agentic tool that evaluates JS/TS code in a Node.js subprocess with
workspace context (can require local modules). Persistent session state between
invocations within the same task.

## Dependencies
None.

## Key Files
| Component | Path |
|-----------|------|
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |

## Recommendation
M0 (Quick Wins). Low priority -- `bash` with `node -e` works. Add when Pi sessions need
richer JS evaluation.
