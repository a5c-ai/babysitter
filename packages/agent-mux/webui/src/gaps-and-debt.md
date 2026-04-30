# Kanban Gaps And Debt

This document tracks the remaining board-, issue-, and workspace-first product gaps for the browser kanban surface after ownership moved into `packages/agent-mux/webui`, with shared contracts in `packages/agent-mux/ui` and server/runtime ownership in `packages/agent-mux/gateway`.

## Current Intent

- keep the primary browser shell in `packages/agent-mux/webui`
- keep shared runtime, API, and transport concerns in the existing `agent-mux` packages
- avoid reviving the deprecated standalone kanban package as a maintained release surface
- extend shared `agent-mux` seams directly when missing capability blocks the UI

## Target Product Model

`packages/agent-mux/webui` should be understood as:

- a board-first planning surface where workflow columns and policy hooks are real shared primitives
- an issue-first orchestration shell where priorities, dependencies, decomposition, and acceptance criteria are first-class entities
- a workspace-first execution surface where worktree lifecycle, ownership, and cleanup are explicit product concepts
- an observability-rich layer where runs, sessions, breakpoints, and telemetry explain and control execution without replacing the board/issue/workspace model

What this means in practice:

- the primary user journey starts from an issue on a board, not from a raw run list
- a workspace exists because an issue needs isolated execution context
- runs and sessions are subordinate execution artifacts linked back to issue and workspace state
- remaining gaps should be tracked as missing capabilities inside this model, not as reasons to recreate the deprecated package shell

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

## Remaining Gaps

- deepen shared issue/project system-of-record APIs rather than relying on seeded local data
- finish richer authoring flows for issue decomposition, planning, and execution context
- continue exposing review, PR, and workspace control from shared APIs while composing the browser UX here
- keep package/release/docs metadata aligned so only the agent-mux surfaces remain first-class
