# Kanban Gaps And Debt

This package is a thin Next.js surface over Babysitter observability and agent-mux session control. It is not yet feature-complete relative to the original Vibe Kanban product shape.

## Current Intent

- keep the app in `packages/kanban`
- make it the single web surface for Babysitter runs plus agent-mux sessions
- avoid rebuilding gateway, session, transport, or hook plumbing locally
- extend `agent-mux` directly when a missing capability blocks the UI

## What Exists Today

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
- no first-class issue entity
- no project backlog model
- no priority, label, assignee, or dependency management in the app
- no issue decomposition workflow before dispatch

Preferred direction:
- add issue/project APIs and models to `agent-mux` or an adjacent shared service layer, then render them here

### 2. Actual kanban board mechanics

Original Vibe Kanban has a real board with columns and issue movement semantics.

Current gap:
- dashboard is still primarily observability-driven, not issue-board-driven
- no draggable columns or card movement
- no WIP limits, swimlanes, or board policies
- no board state transitions like `todo -> in-progress -> review -> done`

Preferred direction:
- introduce board/state primitives at the shared integration layer first, then build the board UI in this package

### 3. Workspace lifecycle

Original Vibe Kanban turns issues into isolated workspaces with branch and worktree ownership.

Current gap:
- no workspace provisioning UI
- no branch/worktree lifecycle controls
- no per-task workspace inventory
- no workspace cleanup, archive, or recovery controls

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

- current package is stronger at observability than at actual kanban planning
- naming says "kanban" while the underlying product model is still mostly run/session-centric
- parity requires real board, issue, and workspace concepts rather than cosmetic renaming

### Publish and release maturation

- CI and publish coverage now include `@a5c-ai/kanban`
- package-specific release verification is still relatively new and should be watched through a few releases

## Recommended Sequencing

1. Finish shared `agent-mux` capabilities needed for issue/workspace/review primitives.
2. Add a first-class kanban board model and state transitions.
3. Add workspace lifecycle and review surfaces.
4. Add Babysitter-native observability overlays that Vibe Kanban does not have.
