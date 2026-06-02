# System Overview

→ [Documentation Index](README.md) | Next: [Current State Analysis](current-state.md)

## Purpose

This document describes the current Babysitter system and the bounded scope of V6. It is not a promise of a future fully decomposed platform. It is a grounding document for what exists now, what V6 is trying to improve, and what remains intentionally out of scope.

## Current System Shape

The repository currently works as a monorepo with a strong operational center:

- `packages/sdk` contains the core orchestration model, storage, task system, replay, CLI infrastructure, hooks, harness abstractions, profiles, plugin management, and process-library support.
- `packages/babysitter` exposes the primary CLI package.
- `packages/tula-platform` provides the agent runtime layer and operational orchestration support.
- `packages/agent-mux/*` provide harness dispatch, adapter normalization, gateway, and user-facing agent interaction surfaces.
- `packages/agent-mux/hooks/*`, `packages/extension-mux`, and `packages/tasks-mux` provide focused cross-harness support rather than a separate speculative platform tier.
- `plugins/*` packages encode real harness-specific integration, packaging, install, and manifest constraints.

This means V6 begins from a working but tightly coupled system, not from a clean-slate layered platform.

## Package Families And Ownership

The easiest way to read the repo is by package family:

- **Orchestration core**: `packages/sdk`, `packages/babysitter`, and `packages/tula-platform` own runs, replay, effect dispatch, CLI surfaces, and runtime orchestration behavior.
- **Dispatch family**: `packages/agent-mux/*` owns harness-facing invocation, adapter normalization, gateway delivery, and shared user-facing agent interaction contracts.
- **Support mux family**: `packages/agent-mux/hooks/*`, `packages/extension-mux`, and `packages/tasks-mux` own hook normalization, plugin compilation, and human approval routing.
- **Distribution surfaces**: `plugins/babysitter-unified/` is the canonical authoring surface, while `plugins/babysitter-*` remain the concrete installable compatibility bundles.
- **Workflow content**: `library/`, project-local `.a5c/processes/`, and `~/.a5c` hold reusable processes, local process definitions, and active operational state.

## Current Operational Flow

From an operator perspective, the live execution path is:

1. A harness surface such as Codex, Claude Code, Cursor, Gemini, Copilot, Pi, or OpenCode loads a concrete plugin bundle from `plugins/babysitter-*`.
2. That bundle is produced from the unified source in `plugins/babysitter-unified/` with help from `packages/extension-mux` and, where relevant, `packages/agent-mux/hooks/*`.
3. The harness integration reaches the operational CLI/runtime surface in `packages/babysitter` and `packages/tula-platform`.
4. The CLI/runtime delegates run creation, replay, task lifecycle, journal/state handling, and process-library access to `packages/sdk`.
5. The SDK executes workflows from `library/` or project-local `.a5c/processes/`, while `packages/tasks-mux` handles structured human approval routing when a process needs it.
6. Where agent dispatch or richer user-facing interaction is required, the runtime integrates with `packages/agent-mux/*` rather than replacing the orchestration core.

## What The System Must Continue To Do

Any V6 change must preserve the repository's core operational capabilities:

- multi-harness orchestration,
- event-sourced run execution and replay,
- plugin discovery, installation, and packaging,
- session and harness integration,
- process-library and workflow execution,
- CLI-driven developer and automation workflows.

## V6 Scope In System Terms

V6 is a maturity program around this existing system. Its near-term goals are:

- document the real boundaries that already exist,
- reduce ambiguity around candidate seams,
- make packaging and validation failures easier to catch,
- create a decision framework for future extraction rather than assuming extraction is always correct.

## Explicit Non-Scope

The current V6 stage does not require:

- conversion of the system into many new top-level packages,
- a fully formalized runtime/platform/application split,
- new distributed coordination infrastructure as a baseline expectation,
- broad new governance or security subsystems described as if already committed.

## External Integration Reality

The system integrates with external model providers, local CLIs, development environments, and filesystem-backed operational workflows. V6 must respect those realities. Claims about isolation, performance, and deployment flexibility are only mature when they are tied to implementation and verification in that environment.

## First Executable V6 Slice

The current V6 program is not "split the monorepo everywhere." The first executable slice is narrower:

- make the `@a5c-ai/tula-platform` seam contract explicit,
- validate that seam with repo-level checks,
- keep naming and ownership honest while larger extractions remain deferred.

The active repo-level validation command for that slice is:

- `npm run verify:v6:seams`

That command is the operational cue for whether the current V6 seam contract is still holding.

## Validation And Honesty Cues

Two rules keep the overview grounded:

- Prefer validation-backed seams over vocabulary-backed seams. If the repo does not have a package, command, or decision record for a concept, it is not yet a committed V6 boundary.
- Describe placeholders honestly. For example, `packages/transport-mux` is currently documented as a placeholder seam with design and migration docs, not as an already-cut-over runtime.

## Architectural Reading Rule

Use the rest of the V6 documents with this framing:

- current repo reality first,
- small validated change second,
- broader future architecture only as deferred exploration.

---

**Related Documents**: [V6 Vision](v6-vision.md) | [V6 Architecture Specification](v6-architecture-specification.md) | [Package Specifications](package-specs.md)
