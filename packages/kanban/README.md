# @a5c-ai/kanban

[![npm version](https://img.shields.io/npm/v/@a5c-ai/kanban.svg)](https://www.npmjs.com/package/@a5c-ai/kanban)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

Board-, issue-, and workspace-first kanban surface for Babysitter orchestration.

## What It Is

`@a5c-ai/kanban` is a single Next.js app under `packages/kanban` that combines:

- board-driven planning and execution
- first-class issue and backlog tracking
- workspace lifecycle inventory and control
- Babysitter run observability
- agent-mux session creation and live session browsing
- hook approval and inbox flows routed through agent-mux

The package is intentionally thin. It should wrap existing `agent-mux` capabilities instead of reimplementing deep gateway, session, or transport logic locally. If the UI needs a capability that does not exist yet, extend `agent-mux` directly and consume it here.

## Target Product Model

`packages/kanban` is not an observer dashboard with a kanban label.
Its target product model is:

- board as the primary planning surface
- issues as the unit of intent, policy, priority, and acceptance
- workspaces as the execution environment owned by those issues
- runs, sessions, breakpoints, and telemetry as observability overlays on top of board execution

That contract keeps the package name honest without pretending the rest of the system should be rebuilt locally. Shared semantics still belong in `agent-mux` and adjacent services; this package should orchestrate and present them.

## Current Product Shape

- Backlog API backed by shared issue, project, and board snapshots
- Dashboard board with workflow columns, swimlanes, policy hooks, and move validation
- Workspace lifecycle inventory and recovery/archive/cleanup controls
- Run dashboard with live updates from Babysitter watcher state
- Session browser and new-session flow backed by agent-mux
- Gateway login and token persistence for local agent-mux access
- Inbox and hook approval surfaces backed by agent-mux UI primitives
- Compendium-based shell, forms, buttons, and branding primitives
- Settings page for runtime and gateway visibility

## Remaining Gaps

The package still has meaningful product gaps, but they are now downstream of the target model rather than evidence that the package should be treated as observability-first:

- deeper review and diff workflows
- richer preview and runtime surfaces per workspace
- repository and pull-request lifecycle controls
- multi-user collaboration and permissions

## Quick Start

### Run directly from the monorepo

```bash
npm install
npm run build --workspace=@a5c-ai/kanban
npm run build:cli --workspace=@a5c-ai/kanban
npm run start --workspace=@a5c-ai/kanban
```

### Development

```bash
npm run dev --workspace=@a5c-ai/kanban
```

The app runs on `http://localhost:4800` by default.

## CLI

The package also publishes a `kanban` CLI entrypoint:

```bash
kanban --help
```

The CLI launches the packaged Next.js app for the kanban surface with the same packaging flow used in the monorepo.

## Design System

The app should use the Compendium design system for user-facing controls and shared branding. When new UI is added:

- prefer Compendium components first
- keep local styling aligned with existing Compendium tokens
- avoid adding one-off primitives when Compendium already covers the case

## Scope Boundaries

- `packages/kanban` owns the Next.js shell and Babysitter-specific workflow presentation
- `packages/agent-mux` owns deep gateway, session, transport, and shared kanban primitives
- missing transport or session features should be added to `agent-mux`, then consumed here

## Gap Map

Feature gaps versus the original Vibe Kanban implementation are tracked in [gaps-and-debt.md](./gaps-and-debt.md).
