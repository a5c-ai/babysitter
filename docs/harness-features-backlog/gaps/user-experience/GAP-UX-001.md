# GAP-UX-001: Ink/React Terminal Rendering Foundation

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Adopt Ink (React for CLI terminals) as the rendering foundation for babysitter's own
output surfaces. This is the infrastructure gap -- the rendering engine itself.

CC uses Ink/React with 144 components across `src/components/` to render every
interaction surface. Babysitter needs this for its embedded SDK dashboard, CLI output,
and breakpoint interaction UI. This is NOT a host harness feature -- it is how
babysitter itself presents orchestration state.

## CC Reference (what they built)
CC's Ink infrastructure includes:
- `src/components/App.tsx` -- root app component
- `src/ink.ts` -- Ink renderer setup
- `src/components/design-system/` -- reusable primitives (Box, Text, etc.)
- `src/components/Spinner/` -- 12 files: animated spinner with shimmer, stall detection, teammate trees
- `src/components/Markdown.tsx`, `MarkdownTable.tsx` -- markdown rendering in terminal
- `src/components/StatusLine.tsx`, `StatusNotices.tsx` -- persistent status bar
- `src/components/VirtualMessageList.tsx` -- virtualized scrolling message list

## Current State
No embedded SDK dashboard exists yet (`packages/sdk/src/dashboard/` does not exist).
CLI commands (`run:status`, `task:list`) output flat JSON or plain text tables.
Interaction module (`packages/sdk/src/interaction/`) uses raw readline for prompts.
No Ink, no React, no component model for terminal rendering.

## Target State
Ink installed as dependency. Reusable component library for terminal rendering:
`Box`, `Text`, `Spinner`, `Table`, `StatusBar`, `ProgressBar`, `Tree`. Embedded SDK
dashboard and key CLI commands built with Ink components. Interaction module
uses Ink for rich breakpoint prompts.

## Dependencies
- None (foundation gap -- other TUI gaps depend on this)

## Sub-Gaps (broken down from this parent)
- [GAP-UX-001a](GAP-UX-001a.md) -- Effect tree visualization
- [GAP-UX-001b](GAP-UX-001b.md) -- Structured diff rendering
- [GAP-UX-001c](GAP-UX-001c.md) -- Permission/breakpoint approval UI
- [GAP-UX-001d](GAP-UX-001d.md) -- Message type rendering
- [GAP-UX-001e](GAP-UX-001e.md) -- Progress and status line
- [GAP-UX-001f](GAP-UX-001f.md) -- Streaming output panels

## Key Files
| Component | Path |
|-----------|------|
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| Catalog UI (React, different renderer) | `packages/catalog/src/app/page.tsx` |
| Interaction module | `packages/sdk/src/interaction/` |
| CLI entry | `packages/sdk/src/cli/main.ts` |
| CC reference | `src/ink.ts` |
| CC components | `src/components/` (144 files) |

## Recommendation
Phase 2 foundation. Add `ink` and `react` as SDK dependencies. Create
`packages/sdk/src/rendering/` with base components. Build embedded SDK dashboard
(`packages/sdk/src/dashboard/`) as proof of concept. Then extend to CLI commands and breakpoint UI.
