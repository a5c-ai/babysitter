# Package Specifications

→ [Documentation Index](README.md) | Previous: [V6 Vision](v6-vision.md)

## Purpose

This document defines package responsibilities for the current V6 stage. It intentionally avoids large speculative API surfaces. A package appears here in one of three states:

- Current: exists now and is part of the executable plan.
- Candidate: may be extracted or renamed if a decision record justifies it.
- Deferred: useful vocabulary, but not a committed deliverable.

## 1. Current Packages

### `@a5c-ai/babysitter-sdk`

- State: Current
- Role: primary orchestration core and most stable architectural anchor
- Responsibilities:
- event-sourced run model,
- task definitions and replay,
- storage, CLI commands, hooks, process-library integration, profiles, plugins, compression, harness abstractions.
- Constraints:
- changes here have broad blast radius,
- extraction from the SDK requires strong evidence and explicit compatibility planning.

### `@a5c-ai/babysitter`

- State: Current
- Role: primary CLI package surface
- Responsibilities:
- user-facing CLI packaging,
- command routing and operational distribution of SDK-backed functionality.
- Constraints:
- must preserve install and operational expectations for existing users.

### `@a5c-ai/agent-platform`

- State: Current
- Role: agent runtime and orchestration-facing execution layer
- Responsibilities:
- harness invocation flows,
- session/runtime integration,
- orchestration runtime behaviors that are not yet proven as standalone packages.
- Constraints:
- still contains multiple concerns,
- any rename away from `@a5c-ai/agent-platform` is deferred until a decision record defines the target name, migration plan, and validation path,
- should be improved by internal seam clarification before broad extraction.

### `plugins/*`

- State: Current
- Role: real integration and packaging boundaries
- Responsibilities:
- harness-specific hooks, commands, skills, manifests, and packaging outputs.
- install, configure, uninstall, update, and registry flows as exposed through current SDK plugin commands.
- Constraints:
- plugin manifests are a practical source of truth for compatibility,
- compiler changes must be checked against actual generated plugin metadata, not just intended schema.
- marketplace or governance claims must not exceed the install/update/manifest behavior evidenced by the repo.

## 2. Candidate Boundaries

These are plausible extraction or rename candidates, but not yet committed deliverables.

### Hook Multiplexing / Plugin Compilation Utilities

- State: Candidate
- Why it might be worth doing:
- the concepts already exist in repo history and surrounding docs,
- packaging and cross-harness compilation are real concerns with observable outputs.
- Extraction trigger:
- the subsystem can be tested and versioned with limited coupling.
- Do not extract if:
- the move mostly renames concepts without reducing risk or complexity.

### Internal Harness Runtime Seams

- State: Candidate
- Why it might be worth doing:
- `agent-platform` likely contains modules with cleaner ownership than the package boundary suggests.
- Extraction trigger:
- a subsystem has isolated tests, narrow dependencies, and clear consumers.
- Do not extract if:
- the seam requires widespread interface invention to stand alone.

### Packaging / Manifest Validation Layer

- State: Candidate
- Why it might be worth doing:
- packaging regressions have immediate user-visible consequences,
- manifest generation rules are concrete and measurable.
- Extraction trigger:
- validation logic becomes cohesive enough to own separately.
- Do not extract if:
- a small internal module or compiler correction is sufficient.

## 3. Deferred Package Vocabulary

The following names may be useful as future concepts, but they are not current package commitments:

- `@a5c-ai/agent-runtime`
- `@a5c-ai/agent-platform`
- `@a5c-ai/agent-platform-meta-plugins`
- `@a5c-ai/agent-platform-orchestration-plugin`

For now, they should be treated as directional language only. Any one of them needs a decision record, validation plan, and migration story before it becomes normative.
Deferred vocabulary refers only to possible future rename or re-scope targets, not to the current package itself. The current package remains `@a5c-ai/agent-platform` unless a later decision record promotes one of the deferred names into scope with an explicit migration plan.
Implementation-phase documents must therefore describe work in current-package terms unless such a decision record has already promoted the deferred name into scope. A deferred package name is not a deliverable placeholder.

This does not block metaplugins as an implemented pattern. In current V6 terms, metaplugins are higher-order capability abstractions over existing plugin and hook packaging surfaces, including on legacy non-Babysitter agents. The deferred item here is the standalone package name `@a5c-ai/agent-platform-meta-plugins`, not the ability to ship capability bundles for concerns like memory systems, governance, or policy enforcement. `@a5c-ai/agent-mux-extensions` remains the compiler that emits the concrete per-harness plugin outputs those metaplugins rely on.

## 4. Responsibility Rules

All package changes proposed under V6 should follow these rules:

1. Prefer internal module boundaries before creating a new package.
2. Prefer compatibility shims over forced flag days.
3. Prefer narrow responsibility tables over large imagined API contracts.
4. Prefer plugin/install validation over abstract packaging diagrams.
5. Prefer one proven seam over many hypothetical ones.

## 5. Package Specification Template

Any future package spec should fit this template:

- State
- Role
- Responsibilities
- Dependencies
- Consumers
- Validation method
- Rollback method
- Extraction or rename trigger

If a package cannot be described that way in one page, it is not ready.

## 6. Validation Expectations

For package-level changes, the default validation set is:

- build or test commands for the touched package,
- install or packaging checks if the package ships externally,
- manifest validation if plugin compilation is involved,
- compatibility notes if naming changes are introduced.

## 7. Invalidated Spec Style

The following spec patterns are explicitly rejected for the current V6 stage:

- multi-page invented API blocks for packages that do not exist,
- broad claims of plugin isolation or governance enforcement without implementation evidence,
- marketplace-governance promises such as certification, revenue sharing, dispute handling, takedown programs, or automatic rollback without executable support,
- describing metaplugins as unavailable until a future standalone package exists,
- equating metaplugins with `extension-mux` or with any single concrete unified plugin bundle,
- dependency graphs that imply committed packages without migration sequencing,
- package lists that obscure which items are real versus hypothetical.

---

Related documents: [V6 Architecture Specification](v6-architecture-specification.md), [V6 Implementation Roadmap](v6-implementation-roadmap.md), [Current State Analysis](current-state.md)
