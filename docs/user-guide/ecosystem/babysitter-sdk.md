---
title: "Component: babysitter-sdk"
description: The core event-sourced orchestration engine behind Babysitter.
category: ecosystem
last_updated: 2026-06-23
---

[Docs](../index.md) › [Ecosystem](./overview.md) › babysitter-sdk

# babysitter-sdk — the core engine

**Package:** `@a5c-ai/babysitter-sdk` · **Metapackage:** `@a5c-ai/babysitter` · **Version:** 5.1.0 · **Maturity:** GA / core

**`babysitter-sdk` is the event-sourced orchestration engine at the center of the whole ecosystem. It is what makes Babysitter deterministic and obedient: your workflow is real code, the orchestrator can only do what that code permits, and every step is recorded in an immutable journal.**

---

## On this page

- [What it is](#what-it-is)
- [What it contains](#what-it-contains)
- [The metapackage](#the-metapackage)
- [Who depends on it](#who-depends-on-it)
- [A minimal example](#a-minimal-example)
- [Next steps](#next-steps)

---

## What it is

The SDK is described in its own package as "storage and run-registry primitives for event-sourced babysitter workflows." In practice it is both the **core library** and the **implementation behind the core CLI**.

The defining behaviors:

- **Process as code.** A process is an `async function process(inputs, ctx)`. The orchestrator executes only what that function asks for — there is no out-of-band agency.
- **Event sourcing.** State lives as an append-only sequence of events in an immutable journal under `~/.a5c/runs/`. The current state is a replay of those events, which gives you **deterministic replay** and **resume from any point**.
- **Mandatory stop + gate enforcement.** After each step the engine stops, asks the process what is permitted next, and either permits the next task or halts until a gate passes. This is the obedience mechanism — *gates block progression; they are not suggestions.*

---

## What it contains

| Piece | Role |
|-------|------|
| `defineTask` | The primitive for declaring a durable unit of work in a process. |
| Effect / journal engine | Records every effect request and resolution as journal events; reconstructs state by replay. |
| Built-in **Pi execution engine** | Powers the "internal" / headless harness used by `genty call --harness internal`. |
| 4-layer token compression subsystem | Reduces context by roughly 50–67%; hooks are auto-registered. |

**Entrypoints (bins):** `babysitter`, `babysitter-sdk`, `babysitter-mcp-server`.

---

## The metapackage

`@a5c-ai/babysitter` is the **metapackage** — "metapackage for installing all babysitter npm packages." It is the recommended human-facing install and ships the `babysitter` bin shim. Most users install this rather than reaching for `babysitter-sdk` directly:

```bash
npm install -g @a5c-ai/babysitter
babysitter --version
```

Reach for `@a5c-ai/babysitter-sdk` directly only when you are **authoring processes or embedding Babysitter in your own code**:

```bash
npm install @a5c-ai/babysitter-sdk
```

---

## Who depends on it

Effectively everything: every Babysitter process, the `babysitter` CLI, and the adapters, hooks, and genty layers all consume the SDK. Atlas supplies metadata *to* the runtime; the SDK is the runtime.

---

## A minimal example

A process is ordinary code. The orchestrator runs the tasks you declare, in the order your code allows, stopping after each one:

```javascript
// process.js — illustrative shape
async function process(inputs, ctx) {
  const research = await ctx.task('research', { prompt: `Analyze ${inputs.repo}` });

  const impl = await ctx.task('implement', {
    prompt: 'Implement the change',
    dependsOn: [research],
  });

  // A gate is just code logic — it blocks progression until satisfied.
  let score = await ctx.task('score', { prompt: 'Score the result 0-100' });
  if (score < 80) {
    await ctx.task('refine', { prompt: 'Improve until the score clears the gate' });
  }

  // Park for human approval — durable, survives restarts (tasks/Breakpoints Adapter).
  await ctx.breakpoint('approve-release', { summary: impl.summary });
  return { done: true };
}
```

Every `ctx.task`, `ctx.breakpoint`, and decision above becomes journal events under `~/.a5c/runs/<runId>/`. The quality gate (`score < 80`) is just one piece of code logic — one capability, not the headline.

---

## Next steps

- **See how the engine connects to everything else:** [Architecture & How It Fits Together](../architecture.md)
- **Run it:** [Installation](../getting-started/installation.md) → [Quickstart](../getting-started/quickstart.md)
- **Author processes:** [Process Definitions](../features/process-definitions.md) and the [Custom Process tutorial](../tutorials/intermediate-custom-process.md)
- **Understand the model:** [Two-Loops Architecture](../features/two-loops-architecture.md) and [Journal System](../features/journal-system.md)
