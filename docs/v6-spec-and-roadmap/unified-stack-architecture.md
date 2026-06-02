# Unified Stack Architecture

→ [Documentation Index](README.md) | Related: [Glossary](glossary.md) | [Stack Guide](stack-guide.md)

## Purpose

This document explains how the already-unified Babysitter and agent-mux stack fits together in the current monorepo. It is a map of today's executable system, not a promise of a larger future decomposition.

## Architecture Stance

The current stack has one strong center and several supporting seams:

- `@a5c-ai/babysitter-sdk` remains the orchestration core.
- `@a5c-ai/babysitter` and `@a5c-ai/agent-platform` provide the operational CLI and runtime surfaces.
- `packages/agent-mux/*` provide the dispatch layer for harness-facing agent execution.
- `@a5c-ai/agent-mux-hooks-cli`, `@a5c-ai/agent-mux-extensions`, and `@a5c-ai/agent-mux-tasks` are focused support subsystems that normalize hooks, compile plugins, and route human approvals.
- `plugins/babysitter-unified/` is the canonical plugin source, while per-harness plugin bundles remain the user-installable outputs.

This is a unified executable stack with explicit package families, not a promise that every family must become its own larger platform.

## End-To-End Shape

```mermaid
flowchart TD
  H[Harness surfaces<br/>Codex, Claude Code, Cursor, Gemini, Copilot, Pi, OpenCode]
  U[Unified plugin source<br/>plugins/babysitter-unified]
  P[Per-harness plugin bundles<br/>plugins/babysitter-*]
  HM[hooks-mux<br/>canonical hook model]
  CLI[babysitter CLI and runtime<br/>@a5c-ai/babysitter<br/>@a5c-ai/agent-platform]
  SDK[babysitter-sdk<br/>runs, replay, storage, tasks]
  LIB[Process library and project processes<br/>library/, .a5c/processes, ~/.a5c]
  BP[tasks-mux<br/>human approval routing]
  APM[extension-mux<br/>plugin compilation]
  AMUX[agent-mux packages<br/>core, adapters, cli, sdk, gateway]
  UI[User surfaces<br/>TUI, web UI, mobile, docs]

  U --> APM
  APM --> P
  H --> P
  P --> HM
  P --> CLI
  HM --> CLI
  CLI --> SDK
  SDK --> LIB
  SDK --> BP
  CLI --> AMUX
  AMUX --> UI
```

## Responsibility Map

The architecture is easiest to reason about as five package families that meet at the orchestration core.

### 1. Orchestration Core

Owned primarily by:

- `packages/sdk`
- `packages/babysitter`
- `packages/agent-platform`

This layer owns runs, replay, task definitions, journal/state handling, hooks dispatch, profiles, process-library bindings, and the CLI commands that operate on those concepts.

### 2. Dispatch Layer

Owned primarily by:

- `packages/agent-mux/core`
- `packages/agent-mux/adapters`
- `packages/agent-mux/cli`
- `packages/agent-mux/sdk`
- `packages/agent-mux/gateway`
- `packages/agent-mux/harness-mock`
- `packages/agent-mux/observability`

This layer knows how to talk to different harnesses and normalize them into a shared agent-running contract. It is complementary to Babysitter rather than a replacement for it: Babysitter orchestrates process execution; agent-mux dispatches and normalizes harness interaction.

### 3. Cross-Harness Support Systems

Owned primarily by:

- `packages/agent-mux/hooks/*`
- `packages/extension-mux`
- `packages/tasks-mux`

These packages solve cross-cutting problems:

- `hooks-mux` normalizes hook events and adapter wiring.
- `extension-mux` compiles one canonical plugin description into harness-specific outputs.
- `tasks-mux` routes human approvals and structured breakpoint responses.

This support layer is part of the delivery path for metaplugins on legacy non-Babysitter agents, but it is not the metaplugin abstraction itself. Metaplugins sit one level higher: they package reusable capability concerns across plugin and hook surfaces. `extension-mux` emits the concrete bundles those concerns need, while unified plugin sources such as `plugins/babysitter-unified/` provide one first-party authoring surface for that delivery.

### 4. Distribution And Installation Surfaces

Owned primarily by:

- `plugins/babysitter-unified`
- `plugins/babysitter-*`

The important distinction is:

- `plugins/babysitter-unified/` is the canonical authoring surface.
- `plugins/babysitter-codex`, `plugins/babysitter-gemini`, and similar directories are the concrete installable bundles and compatibility surfaces.

### 5. User Experience Surfaces

Owned primarily by:

- `packages/agent-mux/tui`
- `packages/agent-mux/webui`
- `packages/agent-mux/ui`
- `packages/agent-mux/mobile-*`
- `packages/agent-mux/tv-*`
- `packages/agent-mux/watch-*`
- `docs/`, `docs-site/`

These packages are consumers of the orchestration and dispatch layers. They are not the architectural center of V6, but they are part of the stack and need coherent ownership boundaries.

## Package Family Map

| Family | Primary paths | What it owns now | What it does not imply |
|---|---|---|---|
| Orchestration core | `packages/sdk`, `packages/babysitter`, `packages/agent-platform` | Run lifecycle, replay, storage, task dispatch, CLI/runtime surfaces | A future forced split into many more top-level runtime packages |
| Dispatch family | `packages/agent-mux/*` | Harness invocation, adapter normalization, gateway, shared interaction contracts | Replacement of Babysitter orchestration |
| Support mux family | `packages/agent-mux/hooks/*`, `packages/extension-mux`, `packages/tasks-mux` | Hook normalization, bundle compilation, human approval routing | A formal "platform layer" that already has independent product boundaries |
| Distribution surfaces | `plugins/babysitter-unified`, `plugins/babysitter-*` | Canonical plugin authoring plus harness-specific installable outputs | One single bundle format with no compatibility constraints |
| User surfaces | `packages/agent-mux/ui`, `packages/agent-mux/webui`, `packages/agent-mux/tui`, `docs-site/` | Human-facing interaction, visualization, docs, and operator surfaces | Ownership of orchestration semantics |

## Operational Path Through The Stack

The end-to-end diagram above is the shape. The live execution narrative is:

1. A concrete harness installs or loads a plugin bundle under `plugins/babysitter-*`.
2. Those bundles are compiled from `plugins/babysitter-unified/` by `packages/extension-mux`, with `packages/agent-mux/hooks/*` normalizing hook behavior where the harness model requires it.
3. The installed bundle reaches the operational runtime in `packages/babysitter` and `packages/agent-platform`.
4. That runtime delegates the core orchestration work to `packages/sdk`, which owns run directories, journal/state replay, effect requests, process-library binding, and workflow execution.
5. When a workflow requires a reusable process, the runtime reaches into `library/` or project-local `.a5c/processes/`.
6. When a workflow requires human approval routing, `packages/tasks-mux` handles that concern as a distinct subsystem instead of burying it inside generic hook language.
7. When the system needs adapter-level dispatch or richer interaction surfaces, `packages/agent-mux/*` carries that responsibility without changing the orchestration center of gravity.

## Integration Contracts That Matter

### Babysitter ↔ Harnesses

Harnesses are reached through plugin bundles, lifecycle hooks, and session binding behavior. This is where `plugins/*`, `hooks-mux`, and harness-specific install surfaces matter.

### Babysitter ↔ Agent-Mux

The key boundary is orchestration versus dispatch:

- Babysitter owns process execution, runs, replay, and effect lifecycles.
- agent-mux owns adapter-level normalization, event streams, invocation modes, and harness interaction surfaces.

### Unified Plugin ↔ Per-Harness Bundles

The unified plugin is the authoring source. Per-harness bundles are the compatibility outputs. V6 should describe both, not collapse them into one concept.

### Orchestration ↔ Human Approval

Breakpoint routing is a distinct concern. `tasks-mux` should be discussed as a supporting subsystem for approvals rather than folded into generic hook or session language.

### V6 ↔ Validation

The current executable seam contract is validated at the repo level through:

- `npm run verify:v6:seams`

That command matters because V6 is supposed to promote real seams with active checks, not only naming changes in design docs.

## What Is Normative Now

- The monorepo already contains Babysitter, agent-mux, hooks-mux, extension-mux, and tasks-mux.
- `packages/sdk` is still the main center of gravity.
- agent-mux is already integrated as repo content, workspace packages, and documentation.
- Unified plugin authoring coexists with per-harness plugin bundles.
- Metaplugins are a current capability-layer concept over plugin and hook surfaces, with `extension-mux` serving as the concrete bundle compiler for legacy non-Babysitter agents.
- `npm run verify:v6:seams` is the active repo validation cue for the first executable V6 seam contract.

## What Is Deferred

- Any forced rename from current packages into a new runtime/platform/application stack.
- Any claim that the mux support packages must become a larger formal platform before their current seams are proven.
- Any architectural story that assumes remote, distributed, or strongly isolated plugin execution by default.
- Any claim that documented placeholder seams such as `packages/transport-mux` are already cut over into the active runtime.

## Validation And Honesty Cues

When a section in this document makes a structural claim, check it against three concrete surfaces:

- **Repo paths**: the relevant package or plugin directory must already exist.
- **Validation commands**: the claim should connect to active checks such as `npm run verify:v6:seams` and, when broader package-boundary honesty matters, `npm run test:architecture`.
- **Placeholder docs**: if a seam is still aspirational, its docs should say so explicitly, as `packages/transport-mux/README.md` and `packages/transport-mux/architecture.md` currently do.

## Reading Rule

If a design discussion makes the stack sound cleaner than the current repo, check whether it is:

1. a real package/path in this monorepo,
2. a current V6 commitment, or
3. only deferred vocabulary.

If the answer is only "vocabulary", it is not yet architecture.

---

**Related Documents**: [System Overview](system-overview.md) | [Package Specifications](package-specs.md) | [Agent-Mux Integration](agent-mux-integration.md)
