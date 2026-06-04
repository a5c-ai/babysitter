# Agent-Mux Repository Integration

→ [Documentation Index](README.md) | Related: [Unified Stack Architecture](unified-stack-architecture.md) | [Package Specifications](package-specs.md)

## Integration Overview

`adapters` is already part of this monorepo under `packages/adapters/*`. The V6 task is not to speculate about a future migration from a separate checkout. The V6 task is to describe how the dispatch layer, orchestration layer, hook normalization layer, and plugin packaging surfaces fit together now.

## Current Repository Reality

The integrated `adapters` package family includes:

### Core Infrastructure

- **`@a5c-ai/comm-adapter`** - Core types, client, and stream engine
- **`@a5c-ai/adapters-codecs`** - Built-in harness adapters
- **`@a5c-ai/adapters-cli`** - `adapters` command-line interface
- **`@a5c-ai/adapters`** - Main SDK package and dispatch surface
- **`@a5c-ai/adapters-gateway`** - Gateway services for remote and browser-facing surfaces

### User Interfaces

- **`@a5c-ai/genty-ui`** - Shared UI foundation
- **`@a5c-ai/genty-web-app`** - Browser interface
- **`@a5c-ai/genty-tui`** - Terminal interface

### Platform-Specific Applications

- **`@a5c-ai/genty-mobile-ios-app`**
- **`@a5c-ai/genty-mobile-android-app`**
- **`@a5c-ai/genty-tv-androidtv-app`**
- **`@a5c-ai/genty-tv-appletv-app`**
- **`@a5c-ai/genty-watch-watchos-app`**
- **`@a5c-ai/genty-watch-wearos-app`**

### Supporting Services

- **`@a5c-ai/adapters-observability`**
- **`@a5c-ai/adapters-harness-mock`**
- **`@a5c-ai/adapters-proxy`**

## How Agent-Mux Fits Into The Stack

Agent-mux is the dispatch layer, not the orchestration core.

- Babysitter owns runs, replay, effect lifecycles, process execution, and CLI orchestration.
- adapters owns harness-facing adapter behavior, normalized event streams, invocation modes, and agent-running APIs.
- `hooks-mux` normalizes hook payloads across harnesses.
- `extension-mux` compiles the unified plugin authoring surface into harness-specific bundles.
- `tasks-mux` handles routed human approval and response flows when those are needed.

This means the integration is already a package-and-boundary question inside one repository, not a cross-repo migration plan.

## Normative V6 Position

V6 currently commits to:

- documenting the actual responsibility split between Babysitter and adapters,
- using the current package layout as the source of truth,
- improving naming, validation, and docs around the existing seams,
- avoiding claims that a deeper runtime/platform/application decomposition is already decided.

V6 does not currently commit to forcing adapters into a new package hierarchy just because those names are possible to imagine.

## Integration Points That Matter Today

### 1. Package Workspaces

The monorepo root includes:

- `packages/*`
- `packages/adapters/*`
- `packages/adapters/hooks/*`

That workspace layout is already evidence that adapters is part of the repo's current operating model.

### 2. Orchestration To Dispatch Boundary

The main integration seam is:

- Babysitter tells the system what work to do and in what order.
- adapters knows how to execute harness-facing agent work consistently.

### 3. Hooks And Plugin Distribution

The plugin and hook story spans multiple packages:

- `plugins/babysitter-unified/` is the canonical plugin authoring surface.
- `packages/extension-mux` is the compiler for harness-specific outputs.
- `packages/adapters/hooks/*` normalizes hook contracts across harnesses.
- per-harness plugin bundles remain the real installation surfaces users consume.

For V6, this package set is the concrete delivery path for metaplugins on legacy non-Babysitter agents. The metaplugin itself is the higher-order capability being expressed across plugin and hook surfaces; `extension-mux` only compiles the concrete outputs that carry it. The intended examples are memory systems, governance or policy engines, and discipline-enforcement layers. The `babysitter-unified` plugin family fits here as a first-party unified plugin source and deployment surface, not as the definition of metaplugins.

### 4. UI And Surface Consumption

The adapters UI, TUI, mobile, TV, and watch packages are downstream consumers of the dispatch layer. They are part of the stack, but they do not redefine the architectural center of V6.

## Deferred Questions

These may still become important later, but V6 does not treat them as settled:

- whether any deeper package split is justified inside `agent-platform`,
- whether some adapters support subsystems should be promoted into stronger standalone boundaries,
- whether future naming should formalize a larger runtime/platform/application vocabulary.

## Practical Reading Order

For the current integrated story, read:

1. [Unified Stack Architecture](unified-stack-architecture.md)
2. [Package Specifications](package-specs.md)
3. [docs/adapters/README](https://github.com/a5c-ai/babysitter/blob/main/docs/adapters/README.md)
4. `packages/adapters/README.md`

---

**Related Documents**: [Unified Stack Architecture](unified-stack-architecture.md) | [Package Specifications](package-specs.md) | [Stack Guide](stack-guide.md)
