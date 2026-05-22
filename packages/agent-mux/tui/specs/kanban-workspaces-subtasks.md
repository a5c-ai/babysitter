# Agent Mux TUI Kanban + Workspaces Backlog Decomposition

## Status Target

All subtasks derived from this document should be opened under `ACA-398` in the `Backlog` column.

## Required Process References

Every implementation subtask should instruct the implementer to build and use a Babysitter process. The implementation process should remain agent/skill driven with no `kind: 'shell'` subtasks and no `breakpoint` tasks.

Relevant references:

- `.a5c/processes/agent-mux-tui-kanban-workspaces-planning.js`
- `.a5c/processes/specs/agent-mux-tui-kanban-workspaces-planning-request.md`
- `library/methodologies/spec-kit/spec-kit-specification.js`
- `library/methodologies/spec-kit/spec-kit-planning.js`
- `library/methodologies/spec-kit/skills/specification-writing/SKILL.md`
- `library/methodologies/spec-kit/skills/planning-design/SKILL.md`
- `library/methodologies/spec-kit/skills/task-decomposition/SKILL.md`
- `library/methodologies/spec-kit/skills/quality-checklist/SKILL.md`
- `library/methodologies/metaswarm/metaswarm-design-review.js`
- `library/methodologies/metaswarm/skills/adversarial-review/SKILL.md`
- `library/methodologies/metaswarm/skills/work-unit-decomposition/SKILL.md`
- `library/methodologies/automaker/skills/kanban-management/SKILL.md`
- `library/methodologies/automaker/skills/worktree-isolation/SKILL.md`

## Subtasks

### AMTUI-KW-1

Title:

- `[AMTUI-KW-1] Add the kanban/workspaces integration contract and control-plane adapter seam to agent-mux-tui`

Dependencies:

- none

References:

- `packages/agent-mux/tui/specs/kanban-workspaces-spec.md`
- `packages/agent-mux/tui/src/plugin.ts`
- `packages/agent-mux/tui/src/index.ts`
- `packages/agent-mux/tui/src/app.tsx`
- `packages/agent-mux/core/src/kanban.ts`
- `packages/kanban/src/mcp/tools/backlog.ts`
- `packages/kanban/src/mcp/tools/workspaces.ts`

Description:

- Define the package-local integration layer that lets `packages/agent-mux/tui` consume kanban backlog and workspace/worktree state without reimplementing `packages/kanban` storage or lifecycle logic.
- Extend shared types in `packages/agent-mux/core/src/kanban.ts` only if the current contract is insufficient for TUI consumption; do not leak private `packages/kanban` service-only shapes into the TUI plugin surface.
- The implementation process should start from `packages/agent-mux/tui/specs/kanban-workspaces-spec.md`, use the repo-local Babysitter planning process as a pattern, and include an adversarial review focused on duplicated ownership, MCP seam drift, and worktree lifecycle leakage into the TUI.

### AMTUI-KW-2

Title:

- `[AMTUI-KW-2] Implement the kanban view plugins, issue navigation, and backlog actions in agent-mux-tui`

Dependencies:

- `AMTUI-KW-1`

References:

- `packages/agent-mux/tui/specs/kanban-workspaces-spec.md`
- `packages/agent-mux/tui/src/command-palette.tsx`
- `packages/agent-mux/tui/src/plugins/sessions-view.tsx`
- `packages/agent-mux/tui/src/plugins/`
- `packages/kanban/src/mcp/tools/backlog.ts`
- `packages/agent-mux/core/src/kanban.ts`

Description:

- Add a `kanban` view to the TUI that exposes backlog/board browsing, issue selection, issue dispatch/repository lifecycle summaries, and issue management actions routed through the established control plane.
- Keep the first implementation phase list- or summary-first if needed, but preserve the domain model and UX seams needed for later richer board rendering.
- The implementation process should use a Babysitter process grounded in Spec-Kit `specification-writing`, `planning-design`, and `task-decomposition`, and it should end with an adversarial review aimed at view-contract drift, inaccessible keyboard flow, and action-surface incompleteness.

### AMTUI-KW-3

Title:

- `[AMTUI-KW-3] Implement the workspaces view and worktree-aware lifecycle actions in agent-mux-tui`

Dependencies:

- `AMTUI-KW-1`

References:

- `packages/agent-mux/tui/specs/kanban-workspaces-spec.md`
- `packages/agent-mux/tui/src/plugins/`
- `packages/kanban/src/mcp/tools/workspaces.ts`
- `packages/kanban/src/lib/workspace-lifecycle.ts`
- `packages/agent-mux/core/src/kanban.ts`

Description:

- Add a `workspaces` view to the TUI that exposes workspace inventory, linked issue metadata, active session/run context, worktree status, and lifecycle actions such as archive/recover/cleanup/rebase management.
- Preserve the existing worktree-aware behavior by routing inventory and action requests through the established workspace lifecycle seams instead of issuing direct git lifecycle commands from the TUI.
- The implementation process should explicitly reference `library/methodologies/automaker/skills/worktree-isolation/SKILL.md`, remain agent/skill driven, and include adversarial review for primary-repo vs linked-worktree handling, missing state transitions, and unsafe action presentation.

### AMTUI-KW-4

Title:

- `[AMTUI-KW-4] Wire cross-view navigation, hotkeys, command-palette support, and package documentation for the new TUI surfaces`

Dependencies:

- `AMTUI-KW-2`
- `AMTUI-KW-3`

References:

- `packages/agent-mux/tui/specs/kanban-workspaces-spec.md`
- `packages/agent-mux/tui/src/app.tsx`
- `packages/agent-mux/tui/src/command-palette.tsx`
- `packages/agent-mux/tui/tests/view-contract.test.ts`
- `packages/agent-mux/tui/README.md`
- `docs/agent-mux/archive/design/20-tui-kanban-workspaces.md`

Description:

- Add the final hotkey, command-palette, selection handoff, and documentation updates needed to make `kanban` and `workspaces` first-class TUI views.
- Ensure the README and view-contract tests are updated together, and keep documentation honest about what is planned versus implemented.
- The implementation process should use a Babysitter process with a documentation-specific pass plus adversarial review focused on mismatched hotkey docs, incomplete navigation loops, and README claims that overstate runtime behavior.

### AMTUI-KW-5

Title:

- `[AMTUI-KW-5] Add verification, packaging, and CI/release hardening for the TUI kanban/workspaces feature`

Dependencies:

- `AMTUI-KW-2`
- `AMTUI-KW-3`
- `AMTUI-KW-4`

References:

- `packages/agent-mux/tui/specs/kanban-workspaces-spec.md`
- `packages/agent-mux/tui/package.json`
- `packages/agent-mux/tui/CHANGELOG.md`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.github/workflows/staging-publish.yml`
- `packages/kanban/package.json`
- `packages/kanban/scripts/verify-release.mjs`

Description:

- Add the tests, package metadata, and CI/release checks needed to keep the new views compatible with both the `@a5c-ai/agent-mux-tui` and `@a5c-ai/kanban` release surfaces.
- Confirm that any new spec assets linked from the TUI README remain part of the packed package surface, and that the feature does not regress the existing `build:agent-mux`, `test:agent-mux`, `build:kanban`, `verify:release`, and staging/release publish workflows.
- The implementation process should cite `quality-checklist`, `adversarial-review`, and CI/CD-oriented library references, and it should close with an explicit verification summary rather than stopping at code changes.

## Dependency Graph

Normative dependency order:

1. `AMTUI-KW-1 -> AMTUI-KW-2`
2. `AMTUI-KW-1 -> AMTUI-KW-3`
3. `AMTUI-KW-2 -> AMTUI-KW-4`
4. `AMTUI-KW-3 -> AMTUI-KW-4`
5. `AMTUI-KW-2 -> AMTUI-KW-5`
6. `AMTUI-KW-3 -> AMTUI-KW-5`
7. `AMTUI-KW-4 -> AMTUI-KW-5`

## Decomposition Rules

Every opened issue should:

- use `Backlog` as the initial status
- link back to `ACA-398`
- cite `packages/agent-mux/tui/specs/kanban-workspaces-spec.md`
- cite this file for dependency/order guidance
- instruct the implementer to build and use a Babysitter process
- explicitly forbid `kind: 'shell'` subtasks and `breakpoint` tasks inside that implementation process
