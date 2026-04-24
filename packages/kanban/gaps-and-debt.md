# Kanban Gaps And Debt

This package is the web shell for a board-, issue-, and workspace-first Babysitter product. It still has meaningful feature gaps relative to the original Vibe Kanban product shape, but the target model is no longer "observer dashboard plus a kanban name".

## Current Intent

- keep the app in `packages/kanban`
- make it the single web surface for board planning, issue execution, workspace control, Babysitter runs, and agent-mux sessions
- avoid rebuilding gateway, session, transport, or hook plumbing locally
- extend `agent-mux` directly when a missing capability blocks the UI

## Target Product Model

`packages/kanban` should be understood as:

- a board-first planning surface where workflow columns and policy hooks are real shared primitives
- an issue-first orchestration shell where priorities, dependencies, decomposition, and acceptance criteria are first-class entities
- a workspace-first execution surface where worktree lifecycle, ownership, and cleanup are explicit product concepts
- an observability-rich layer where runs, sessions, breakpoints, and telemetry explain and control execution without replacing the board/issue/workspace model

What this means in practice:

- the primary user journey starts from an issue on a board, not from a raw run list
- a workspace exists because an issue needs isolated execution context
- runs and sessions are subordinate execution artifacts linked back to issue and workspace state
- remaining gaps should be tracked as missing capabilities inside this model, not as reasons to rename the package or collapse it back into an observer dashboard

## What Exists Today

- first-class backlog snapshots with project, issue, dependency, decomposition, and acceptance-criteria data
- shared board snapshots with columns, swimlanes, WIP policies, and move validation
- workspace lifecycle inventory with archive, cleanup, and recovery controls
- live Babysitter run dashboard and detail views
- SSE-backed status updates and cached run parsing
- breakpoint visibility and approval flows
- agent-mux gateway login, session list, session detail, and new-session flows
- inbox and tool-call interaction surfaces
- Babysitter-specific settings and status framing

## Vibe Kanban Feature Gaps

### 1. Issue and project model

Original Vibe Kanban centers the product on issues, projects, statuses, labels, and acceptance criteria.

Current gap:
- shared issue/project entities exist, but they are still seeded and local-file-backed rather than true shared system-of-record APIs
- assignee, label, dependency, and acceptance-criteria data exists, but authoring/editing flows are still thin
- issue decomposition is represented, but dispatch and planning workflows still need deeper authoring UX

Preferred direction:
- add issue/project APIs and models to `agent-mux` or an adjacent shared service layer, then render them here

### 2. Actual kanban board mechanics

Original Vibe Kanban has a real board with columns and issue movement semantics.

Current gap:
- a real board now exists, but it is still the opening slice of the product rather than the full planning surface
- movement semantics are policy-aware, but richer board operations such as bulk moves, richer authoring, and planning views are still missing
- WIP limits, swimlanes, and workflow transitions exist, but board customization is still minimal

Preferred direction:
- introduce board/state primitives at the shared integration layer first, then build the board UI in this package

### 3. Workspace lifecycle

Original Vibe Kanban turns issues into isolated workspaces with branch and worktree ownership.

Current gap:
- workspace inventory, archive, cleanup, and recovery controls now exist
- provisioning still routes through session creation rather than a richer issue-to-workspace workflow
- branch/worktree ownership exists operationally, but issue-scoped provisioning and richer recovery flows still need work

Preferred direction:
- extend `agent-mux` and Babysitter integration points for workspace lifecycle operations; keep this package as the orchestration shell

### 4. Review and diff workflow

Original Vibe Kanban supports inline review, agent feedback loops, and merge-oriented workflows.

Current gap:
- no diff viewer
- no inline review comments mapped to agent feedback
- no review queue by issue/workspace
- no merge or approval lifecycle in the UI

Preferred direction:
- expose review artifacts and diff actions through shared APIs, then compose the review UX here

### 5. Preview, terminal, and dev-server surfaces

Original Vibe Kanban includes built-in preview, browser inspection, and workspace runtime affordances.

Current gap:
- no preview iframe/device emulation
- no terminal/session shell surface per workspace
- no dev-server status or logs panel scoped to a workspace
- no inspect-mode equivalent

Preferred direction:
- add runtime session and preview capabilities to `agent-mux` where appropriate, then consume them in `packages/kanban`

### 6. PR and repository lifecycle

Original Vibe Kanban includes PR creation, review, and merge steps from the UI.

Current gap:
- no PR creation flow
- no repository linking or repo-scoped settings
- no merge status, CI gate, or publish status surfaced per work item

Preferred direction:
- shared repo/PR actions belong below this package; this package should only orchestrate and present them

### 7. Team and collaboration model

Original Vibe Kanban is closer to a multi-user planning and execution product.

Current gap:
- no team/project settings surfaces
- no collaborator or assignee model
- no activity feed scoped to shared board entities
- no permissions model beyond gateway token possession

Preferred direction:
- establish shared multi-user primitives before attempting collaborative board UX here

## Babysitter-Specific Opportunities

These are additions that should exist beyond Vibe Kanban parity because this package is for Babysitter:

- run-centric board views that map Babysitter state to kanban stages
- richer breakpoint review flows with run/task context
- observability timelines merged with session activity
- run health, retries, stuck-task detection, and recovery controls
- effect/task artifacts surfaced alongside agent-mux conversation state
- easy navigation between run, session, inbox, and review surfaces

## Technical Debt

### Identity drift from observer-dashboard bootstrap

- package-facing naming, docs, comments, and persistence keys were normalized in `KANBAN-DEBT-001`
- legacy observer env vars, config files, and localStorage keys are still read as compatibility fallbacks

### Partial design-system adoption

- shell, forms, and branding now use Compendium in key places
- a broader pass is still needed for complete visual consistency
- some legacy local components still define styling that should eventually be folded into Compendium or aligned to its tokens

### Product-model mismatch

- package naming and product contract should stay aligned to the board/issue/workspace model now present in the app
- remaining debt is about maturing those first-class concepts into deeper review, preview, PR, and collaboration flows
- do not paper over missing capabilities with brand language; track the unfinished work as missing board-product capabilities, not as an excuse to retreat to observability-first framing

### Publish and release maturation

- CI and publish coverage now include `@a5c-ai/kanban`
- package-specific release verification is still relatively new and should be watched through a few releases

## Recommended Sequencing

1. Mature shared `agent-mux` capabilities so issue/project/workspace data becomes a real shared system of record.
2. Deepen board authoring, movement, and review workflows on top of the existing shared board model.
3. Connect issue-driven workspace provisioning and richer workspace runtime surfaces.
4. Add Babysitter-native observability overlays that strengthen execution without replacing the board-first product model.
