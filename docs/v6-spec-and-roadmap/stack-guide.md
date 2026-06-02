# Stack Guide

→ [Documentation Index](README.md) | Related: [Glossary](glossary.md) | [Unified Stack Architecture](unified-stack-architecture.md)

## Purpose

This guide is the fast path for navigating the unified stack. Use it when you need to know where to start reading, which package owns a concern, and which docs are normative versus supporting context.

## Start Here

If you are new to the stack, read these in order:

1. [System Overview](system-overview.md)
2. [Glossary](glossary.md)
3. [Unified Stack Architecture](unified-stack-architecture.md)
4. [V6 Architecture Specification](v6-architecture-specification.md)
5. [Package Specifications](package-specs.md)

Then branch into the area you are actually changing.

Before proposing a new seam, run the active validation cue for the first executable V6 slice:

- `npm run verify:v6:seams`

## If You Need To Change Orchestration

Read:

- [V6 Architecture Specification](v6-architecture-specification.md)
- [Package Specifications](package-specs.md)
- [Testing Framework](testing-framework.md)

Work mainly in:

- `packages/sdk`
- `packages/babysitter`
- `packages/tula-platform`
- `library/`
- project-local `.a5c/processes/`

## If You Need To Change Harness Dispatch

Read:

- [docs/agent-mux/README](https://github.com/a5c-ai/babysitter/blob/main/docs/agent-mux/README.md)
- [Agent-Mux Integration](agent-mux-integration.md)
- [Unified Stack Architecture](unified-stack-architecture.md)

Work mainly in:

- `packages/agent-mux/core`
- `packages/agent-mux/adapters`
- `packages/agent-mux/cli`
- `packages/agent-mux/sdk`
- `packages/agent-mux/gateway`

## If You Need To Change Hook Behavior

Read:

- `packages/agent-mux/hooks/README.md`
- `packages/agent-mux/hooks/ARCHITECTURE.md`
- [Agent-Mux Integration](agent-mux-integration.md)

Work mainly in:

- `packages/agent-mux/hooks/core`
- `packages/agent-mux/hooks/cli`
- `packages/agent-mux/hooks/adapter-*`
- `plugins/babysitter-unified/hooks/`

## If You Need To Change Plugin Packaging

Read:

- `packages/extension-mux/unified_plugin_system_spec.md`
- `plugins/babysitter-unified/README.template.md`
- per-harness plugin README files under `plugins/babysitter-unified/per-harness/`

Work mainly in:

- `packages/extension-mux`
- `plugins/babysitter-unified`
- concrete bundles under `plugins/babysitter-*`

## If You Need To Change Human Approval Or Breakpoint Routing

Read:

- `packages/tasks-mux/specs/architecture.md`
- [Testing Framework](testing-framework.md)

Work mainly in:

- `packages/tasks-mux`
- `packages/sdk` breakpoint integration
- related hook and plugin surfaces if the transport changes

## If You Need To Change UI Surfaces

Read:

- `packages/agent-mux/README.md`
- package README files under `packages/agent-mux/*`

Work mainly in:

- `packages/agent-mux/ui`
- `packages/agent-mux/webui`
- `packages/agent-mux/tui`
- `packages/agent-mux/mobile-*`
- `packages/agent-mux/tv-*`
- `packages/agent-mux/watch-*`
- `docs-site/` or `packages/atlas/webui` where relevant

## Source-Of-Truth Map

Use this rule of thumb:

| Concern | Primary source of truth | Supporting references |
|---|---|---|
| V6 architecture scope | `docs/v6-spec-and-roadmap/` | package READMEs, adversarial analyses |
| Orchestration runtime behavior | `packages/sdk`, `packages/babysitter`, `packages/tula-platform` | V6 docs, CLI docs |
| Harness dispatch behavior | `packages/agent-mux/*` and `docs/agent-mux/` | V6 integration docs |
| Hook normalization | `packages/agent-mux/hooks/*` | per-harness plugin docs |
| Unified plugin packaging | `packages/extension-mux`, `plugins/babysitter-unified/` | install READMEs for concrete bundles |
| Breakpoint routing | `packages/tasks-mux` | SDK integration docs |

## Practical Rules

- Start from the package that already owns the behavior before proposing a new layer.
- If a document describes a future package or layer, check whether V6 marks it as deferred.
- Treat installable plugin bundles as real compatibility surfaces even when the unified plugin source exists.
- Use package names and paths when discussing ownership; use architecture terms only when they map to a real current seam.
- Treat validation commands as part of the architecture surface. If a seam has no repo path and no active validation cue, it is still design exploration.

---

**Related Documents**: [Current State](current-state.md) | [Glossary](glossary.md) | [Unified Stack Architecture](unified-stack-architecture.md)
