# Glossary

→ [Documentation Index](README.md) | Related: [Unified Stack Architecture](unified-stack-architecture.md) | [Stack Guide](stack-guide.md)

## Purpose

This glossary defines the canonical terms used across the V6 documents. It exists to keep the unified Babysitter, agent-mux, and mux-support packages described with one vocabulary.

## Terms

### Adapter

A harness-specific implementation that translates one external tool's behavior into a shared contract. In `agent-mux`, adapters normalize spawn args, sessions, auth, and event parsing. In `hooks-mux`, adapters normalize hook payloads across harnesses.

### Agent

A reasoning worker used to perform subjective work such as planning, review, drafting, or analysis. In Babysitter task definitions, this is distinct from deterministic `shell` work.

### Agent-Mux

The dispatch layer for local CLI-based coding agents. In this repo it lives under `packages/agent-mux/*` and includes core types, adapters, CLI, SDK, gateway, observability, mock harnesses, and multiple UI surfaces.

### Agent-Plugins-Mux

The cross-harness plugin compiler. It turns one canonical plugin definition into harness-specific plugin bundles, rather than maintaining each bundle by hand.

### Babysitter

The orchestration system centered on event-sourced runs, effects, replay, and process-library execution. In docs, "Babysitter" refers to the overall orchestration stack, not only the CLI package.

### Babysitter Agent

The operational agent runtime package, currently `@a5c-ai/babysitter-agent`. It is part of the current executable stack, even though V6 treats some deeper runtime/platform naming as deferred vocabulary rather than committed package splits.

### Babysitter CLI

The user-facing `babysitter` command package, currently `@a5c-ai/babysitter`. It exposes operational commands backed by the SDK.

### Babysitter SDK

The architectural center of gravity for the current stack. `@a5c-ai/babysitter-sdk` owns the run model, storage, replay engine, task system, hooks, profiles, process-library integration, plugin management, and harness abstractions.

### Breakpoint

A human approval or clarification gate emitted by a process. In Babysitter, breakpoints are part of the effect model and should not be confused with debugger breakpoints.

### Breakpoints-Mux

The serverless breakpoint routing subsystem. It multiplexes breakpoint questions and answers across backends and can add cryptographic proof to responses.

### Command Surface

A harness-visible way to invoke functionality, such as slash commands, marketplace actions, or plugin-installed commands. Command surfaces are packaging artifacts, not the orchestration runtime itself.

### Effect

A unit of external work requested by a process during replay. Common effect kinds are `agent`, `skill`, `shell`, `breakpoint`, and `sleep`. Effects are posted back into the run journal after execution.

### Harness

An external coding environment or CLI such as Codex, Claude Code, Cursor, Gemini CLI, Copilot, Pi, or OpenCode. Harnesses are the execution environments Babysitter and agent-mux integrate with.

### Hook

A harness lifecycle callback such as session start, stop, prompt submission, or tool interception. Hooks are normalized by `hooks-mux` and then routed into plugin or orchestration behavior.

### Hooks-Mux

The hook normalization layer. It provides canonical schemas, a merge engine, CLI tools, and per-harness adapters so one hook model can be projected across different harnesses.

### Invocation Mode

The environment in which an agent run executes, such as local, docker, ssh, or k8s. This is an `agent-mux` dispatch concern, not a Babysitter run-type concept.

### Metaplugin

A higher-order capability abstraction that extends an agent by composing one or more plugin and hook surfaces into a single concern. A metaplugin is not the same thing as a concrete per-harness plugin bundle, and it is not the same thing as `@a5c-ai/extension-mux`, which only compiles and distributes concrete plugin outputs. Typical metaplugin categories include memory systems, governance or policy engines, and discipline-enforcement layers. On legacy non-Babysitter agents, a metaplugin is delivered through the underlying plugin and hook bundles emitted by `extension-mux`.

### Per-Harness Plugin Bundle

The concrete installable bundle for one harness, such as `plugins/babysitter-codex` or `plugins/babysitter-gemini`. These are the real compatibility surfaces users install.

### Process

A JavaScript module that describes orchestration logic in terms of effect requests, branching, review loops, and completion conditions. A process is not the same thing as a run.

### Process Library

The shared repository of reusable methodologies, specializations, processes, skills, and agents that Babysitter can bind and execute from `~/.a5c`.

### Run

One concrete execution of a process, stored under `.a5c/runs/<runId>/`. A run has metadata, journal events, task artifacts, and terminal completion proof.

### Session

The binding between orchestration state and a harness conversation or runtime context. Sessions let Babysitter resume, correlate, and safely continue work across iterations.

### Skill

A reusable instruction bundle, usually file-based, for performing a specialized kind of work. Skills are different from commands: a command is a harness entrypoint, while a skill is a reusable execution pattern.

### Unified Plugin

The canonical plugin source under `plugins/babysitter-unified/`. It describes hooks, commands, skills, context files, and target-specific overrides that can be compiled into per-harness bundles.

### V6

The current architecture program for the stack. V6 is a documentation and validation discipline around the existing repo, not a promise of immediate large-scale package decomposition.

### Working Surface

The actual surface a developer changes to implement a feature or fix: for example `packages/sdk`, `packages/agent-mux/adapters`, `packages/hooks-mux/core`, or `plugins/babysitter-unified`. V6 prefers identifying the real working surface before proposing extra package layers.

## Naming Rule

When a term can refer to both a concept and a package, prefer these patterns:

- Use lowercase prose for the concept: "the orchestration runtime", "the unified plugin".
- Use exact package or path names for code ownership: `@a5c-ai/babysitter-sdk`, `packages/agent-mux/core`, `plugins/babysitter-unified`.
- Treat speculative layer names such as "platform" or "application layer" as deferred vocabulary unless a V6 document explicitly marks them as normative.

---

**Related Documents**: [System Overview](system-overview.md) | [Unified Stack Architecture](unified-stack-architecture.md) | [Package Specifications](package-specs.md)
