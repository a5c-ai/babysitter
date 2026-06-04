# Agent Mux TUI Kanban + Workspaces Design

## Summary

This design proposal covers adding `kanban` and `workspaces` views to `packages/adapters/tui` as a thin presentation and command layer over existing `packages/kanban` and `packages/adapters/core` seams.

The key architectural decision is simple:

- `packages/adapters/tui` owns Ink rendering, navigation, and action invocation
- `packages/kanban` remains the owner of backlog policy and workspace/worktree lifecycle
- `packages/adapters/core` remains the shared type contract

## Why this direction

The repository already has the hard parts:

- shared kanban/workspace types in `packages/adapters/core/src/kanban.ts`
- backlog policy and issue mutation logic in `packages/kanban/src/lib/services/backlog-query-service.ts`
- worktree-aware workspace lifecycle logic in `packages/kanban/src/lib/workspace-lifecycle.ts`
- MCP tool surfaces in `packages/kanban/src/mcp/tools/backlog.ts` and `packages/kanban/src/mcp/tools/workspaces.ts`

Duplicating those behaviors in the TUI would create:

- divergent issue/workspace mutation rules
- duplicated worktree inventory logic
- higher regression risk across CI/release and staging publish flows

## Proposed package seams

### `packages/adapters/tui`

Add:

- a package-local integration adapter for kanban/workspace state
- `kanban` and `workspaces` plugins under `src/plugins/`
- cross-view navigation wiring in `src/app.tsx`
- command-palette and hotkey integration
- view-contract and feature tests

### `packages/adapters/core`

Only add or refine shared types here when the TUI needs a stable contract that does not yet exist.

Do not import `packages/kanban` private service result types into the TUI if they should be shared.

### `packages/kanban`

Keep ownership of:

- backlog state and mutation policy
- workspace/worktree lifecycle
- issue-to-workspace provisioning and linking

Refine tool payloads or typed seams only where the TUI integration proves a real contract gap.

## View model expectations

### `kanban`

The first phase can start with a backlog/issue-centric presentation instead of a dense ncurses-style board.

The important requirement is that it exposes:

- issue state
- dispatch/readiness state
- repository lifecycle state
- workspace/session linkage
- management actions

### `workspaces`

The workspaces surface must stay worktree-aware.

It should expose:

- workspace path/name/branch/head
- primary repo vs linked worktree state
- archived/missing/rebase states
- linked issue context
- active session/run context
- lifecycle actions

## CI and publish implications

This feature touches both `@a5c-ai/tula-tui` and the shared kanban/workspace release-critical surfaces.

That means implementation needs to remain compatible with:

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.github/workflows/staging-publish.yml`

It also means the TUI package should ship its new `specs/` directory if the README links to those planning artifacts.

## Planning artifacts

The canonical planning artifacts for this proposal are:

- `packages/adapters/tui/specs/kanban-workspaces-spec.md`
- `packages/adapters/tui/specs/kanban-workspaces-subtasks.md`
- `.a5c/processes/adapters-tui-kanban-workspaces-planning.js`
- `.a5c/processes/specs/adapters-tui-kanban-workspaces-planning-request.md`
