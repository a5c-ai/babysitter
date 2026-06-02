# Agent Mux TUI Kanban + Workspaces Specification

## Purpose

This document defines a brownfield feature slice for adding `kanban` and `workspaces` views, navigation, and management actions to [`packages/agent-mux/tui`](../README.md).

The goal is to expose the existing board-, issue-, workspace-, and worktree-oriented surfaces already owned elsewhere in the repository without turning the TUI into a second implementation of backlog storage or git worktree lifecycle logic.

## Scope

This specification covers:

- TUI view and command-surface additions in `packages/agent-mux/tui`
- reuse of shared kanban types from `packages/agent-mux/core/src/kanban.ts`
- integration with existing `packages/kanban` MCP and workspace lifecycle seams
- worktree-aware workspace inventory and lifecycle management expectations
- documentation, package metadata, testing, CI, and release-surface implications
- backlog decomposition for implementation under `ACA-398`

This specification does not claim the feature is implemented today.

## Problem Statement

The current TUI already provides session-, model-, config-, skills-, and observability-oriented views, but it does not expose:

- kanban backlog and board state
- issue dispatch and repository lifecycle state
- workspace inventory and worktree lifecycle actions
- cross-links between active agent sessions and their issue/workspace ownership

At the same time, the repository already contains:

- shared kanban and workspace-facing types in `packages/agent-mux/core/src/kanban.ts`
- issue/backlog management logic in `packages/kanban/src/lib/services/backlog-query-service.ts`
- worktree-aware workspace lifecycle logic in `packages/kanban/src/lib/workspace-lifecycle.ts`
- MCP surfaces for backlog and workspaces in `packages/kanban/src/mcp/tools/backlog.ts` and `packages/kanban/src/mcp/tools/workspaces.ts`

The feature should therefore integrate those surfaces into the TUI rather than cloning them.

## Existing Seams

### TUI host

The current TUI architecture is plugin-first:

- view registration: `packages/agent-mux/tui/src/plugin.ts`
- plugin registry/bootstrap: `packages/agent-mux/tui/src/registry.ts`
- built-in plugin ordering: `packages/agent-mux/tui/src/index.ts`
- top-level shell and routing: `packages/agent-mux/tui/src/app.tsx`
- command palette: `packages/agent-mux/tui/src/command-palette.tsx`
- binary bootstrap: `packages/agent-mux/tui/src/bin/agent-mux-tui.tsx`

### Shared kanban contract

The current shared contract already models the domain concepts needed by the new views:

- issue and board state: `packages/agent-mux/core/src/kanban.ts`
- repository lifecycle and review state: `packages/agent-mux/core/src/kanban.ts`
- workspace links and permissions: `packages/agent-mux/core/src/kanban.ts`

### Existing kanban control plane

The TUI should integrate through the existing control plane:

- backlog tools: `packages/kanban/src/mcp/tools/backlog.ts`
- workspace tools: `packages/kanban/src/mcp/tools/workspaces.ts`
- workspace lifecycle logic: `packages/kanban/src/lib/workspace-lifecycle.ts`
- backlog services: `packages/kanban/src/lib/services/backlog-query-service.ts`

## Architecture Direction

### Normative stance

The TUI must not become the owner of kanban persistence, issue mutation policy, or git worktree orchestration.

The TUI should be:

- a presentation and command surface
- a thin integration client over shared core types and existing control-plane APIs

The TUI should not:

- parse and manage backlog JSON on its own
- issue raw `git worktree` commands directly as its first-phase management surface
- duplicate `packages/kanban` business rules for workspace lifecycle or board movement

### Integration seam

The first implementation phase should add a package-local integration layer inside `packages/agent-mux/tui` with responsibilities such as:

- loading kanban snapshots and workspace inventory
- invoking backlog/workspace actions through existing MCP endpoints or an extracted adapter seam
- mapping TUI selection state to issue/workspace/session identifiers

That layer should consume:

- `packages/agent-mux/core/src/kanban.ts` for stable shared types
- `packages/kanban/src/mcp/tools/backlog.ts`
- `packages/kanban/src/mcp/tools/workspaces.ts`

If gaps in the shared type contract are discovered, the work should extend `packages/agent-mux/core` first instead of leaking `packages/kanban` private service shapes into the TUI.

## Proposed Views

### `kanban` view

The TUI should gain a new `kanban` view that exposes:

- backlog summary and board/project selection
- issue list or board-column rendering
- quick selection into issue detail
- issue lifecycle and dispatch summary
- issue-to-session/workspace linkage when available

The first implementation phase may start list-first rather than rendering a dense board layout, but it must preserve the domain model needed for:

- backlog browsing
- board-state inspection
- management actions

### `workspaces` view

The TUI should gain a new `workspaces` view that exposes:

- workspace inventory
- linked issue metadata
- current branch/head/worktree state
- active session and run linkage
- lifecycle/rebase/archive/recover state

The workspaces view must reflect that workspaces may be:

- primary repos
- linked git worktrees
- archived or missing
- mid-rebase

### Navigation expectations

The feature must define:

- new hotkeys and command-palette entries
- selection handoff between kanban, workspaces, sessions, and chat
- consistent status messages through the existing `emit({ type: 'status', ... })` seam

The implementation must update:

- `packages/agent-mux/tui/tests/view-contract.test.ts`
- `packages/agent-mux/tui/README.md`

with the final hotkey contract.

## Management Actions

### Kanban actions

The first phase should plan for management actions such as:

- create issue or sub-issue
- move issue across workflow states
- update issue detail
- provision a workspace for an issue
- link an existing workspace back to an issue

These actions should be routed through the existing kanban control plane rather than implemented as direct file mutation inside the TUI.

### Workspace actions

The first phase should plan for lifecycle actions already modeled in `packages/kanban/src/mcp/tools/workspaces.ts`, including:

- `archive`
- `cleanup`
- `recover`
- `notes-save`
- rebase-related actions

The TUI should surface those actions in a way that makes the linked issue/workspace state visible before mutation.

## Worktree Contract

Workspace management in the TUI must preserve the repository's existing worktree-aware behavior:

- workspace inventory comes from the shared workspace lifecycle service
- linked worktree state stays authoritative in `packages/kanban/src/lib/workspace-lifecycle.ts`
- the TUI consumes inventory/action APIs rather than inferring worktree topology on its own

This is especially important because current workspace logic already accounts for:

- `git worktree list --porcelain`-style inventory modeling
- managed workspace registry data
- primary repo vs linked worktree distinction
- recovery/archive/cleanup actions

## Cross-Package Integration Requirements

### `packages/agent-mux/tui`

Expected implementation seams include:

- `packages/agent-mux/tui/src/index.ts`
- `packages/agent-mux/tui/src/app.tsx`
- `packages/agent-mux/tui/src/plugin.ts`
- `packages/agent-mux/tui/src/command-palette.tsx`
- new plugin files under `packages/agent-mux/tui/src/plugins/`
- new tests under `packages/agent-mux/tui/tests/`

### `packages/agent-mux/core`

If the TUI needs new stable shared types or normalized shapes for workspace summaries, those additions belong in:

- `packages/agent-mux/core/src/kanban.ts`
- `packages/agent-mux/core/tests/kanban.test.ts`

### `packages/kanban`

The first implementation phase should avoid changing ownership of backlog/workspace business logic, but may require:

- hardening or clarifying MCP/tool payloads
- minor adapter-focused shape refinements
- documentation of the TUI as an additional consumer

Likely touchpoints:

- `packages/kanban/src/mcp/tools/backlog.ts`
- `packages/kanban/src/mcp/tools/workspaces.ts`
- `packages/kanban/src/lib/services/backlog-query-service.ts`
- `packages/kanban/src/lib/workspace-lifecycle.ts`

## Documentation Requirements

The implementation must keep the documentation honest about current behavior.

That means:

- normative current-behavior docs under `docs/agent-mux/reference/` should not claim the views exist before implementation lands
- proposal-stage material belongs in `docs/agent-mux/archive/design/`
- package-level README content may reference the planning artifacts, but must clearly mark them as planned work until the runtime surface exists

## Testing and CI/CD Contract

### Package-level expectations

Implementation work derived from this spec must keep the agent-mux and kanban validation surfaces green.

Relevant package-level commands include:

- `npm run build:agent-mux`
- `npm run test:agent-mux`
- `npm run build:kanban`
- `npm run build:cli --workspace=@a5c-ai/kanban`
- `npm run verify:release --workspace=@a5c-ai/kanban`
- `npm run test:kanban`

### Workflow integration

The feature must stay compatible with:

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.github/workflows/staging-publish.yml`

Implications to plan for:

- `@a5c-ai/agent-mux-tui` remains part of the `build:agent-mux` and `test:agent-mux` surface
- `@a5c-ai/kanban` remains part of the release/staging build, test, verify, and pack/publish surfaces
- any new TUI spec assets linked from the package README should remain available in the packed package surface

### Publication contract

Because this spec is intentionally part of the package planning surface, `packages/agent-mux/tui/package.json` should ship `specs/` alongside the README.

If that publish-surface decision changes later, the README links and this specification must be updated together.

## Acceptance Criteria

The feature plan is implementation-ready only when all of the following are true:

1. The TUI is specified as a consumer of existing kanban/workspace control-plane seams, not as a second backlog/worktree owner.
2. The spec names the specific package and file seams expected to change across `agent-mux/tui`, `agent-mux/core`, and `kanban`.
3. The spec defines both kanban and workspace/worktree view responsibilities.
4. The spec covers management actions, not just passive read-only views.
5. The spec captures navigation, hotkey, and command-palette implications for the current TUI plugin contract.
6. The spec records CI, release, and publish-surface implications.
7. The spec supports an issue decomposition that can be opened under `ACA-398` with explicit dependencies.

## External Constraint Notes

The design should stay aligned with current first-party/runtime constraints that were rechecked during planning:

- Ink remains the React-based TUI layer used by `packages/agent-mux/tui`, so new views should follow the existing plugin/view registration model.
- Git worktree lifecycle remains centered on `list`, `add`, and `remove`, which reinforces the decision to keep lifecycle ownership in the existing workspace service rather than the TUI shell.
- GitHub reusable workflows still require direct placement in `.github/workflows`, so CI/CD integration for this feature remains a workflow-file concern rather than a nested package-local convention.
- Node TTY resize behavior remains relevant to the existing viewport/layout code in `packages/agent-mux/tui/src/app.tsx`, so any dense board/workspace rendering needs to respect the current viewport logic instead of bypassing it.
