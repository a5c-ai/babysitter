---
title: "Component: observer-dashboard"
description: The real-time SSE run observability dashboard.
category: ecosystem
last_updated: 2026-06-23
---

[Docs](../index.md) › [Ecosystem](./overview.md) › observer-dashboard

# observer-dashboard — real-time run observability

**Package:** `@a5c-ai/babysitter-observer-dashboard` · **Version:** 5.1.0 · **Maturity:** GA

**The observer dashboard is a real-time observability UI for Babysitter orchestration runs. It streams run events over SSE and renders task progress, journal events, and orchestration state live in your browser.**

Because every run is event-sourced, the dashboard does not need to poll or guess — it simply consumes the same immutable journal the engine writes, as it is written.

---

## On this page

- [What it is](#what-it-is)
- [How to launch it](#how-to-launch-it)
- [How it works](#how-it-works)
- [Who uses it](#who-uses-it)
- [Next steps](#next-steps)

---

## What it is

Per its package description, it is the "real-time observability dashboard for babysitter orchestration runs." It is built on **Next.js** (the v6 announcement cites Next.js 16 / React 19), streams run events via **Server-Sent Events (SSE)**, virtualizes large run histories with `@tanstack/react-virtual`, and uses the Compendium design system. It renders task progress, journal events, and orchestration state in the browser.

---

## How to launch it

The dashboard ships a bin and is also launchable from inside a harness:

```bash
# In-session (Claude Code and other harnesses):
/babysitter:observe

# Via the genty runtime CLI:
genty observe
```

The underlying bin is `babysitter-observer-dashboard` (`dist/cli.js`). Source lives under `packages/observer-dashboard/src/` (`app/`, `components/`, `lib/`, `cli.ts`).

---

## How it works

```
Engine appends events  →  immutable journal (~/.a5c/runs/<runId>/)  →  SSE stream  →  Dashboard
```

The engine writes journal events as the run progresses; the dashboard subscribes to the stream and renders them. Large histories are virtualized so the UI stays responsive on long-running or high-volume runs.

---

## Who uses it

Anyone monitoring a live or historical Babysitter run — to watch convergence, see which task is executing, inspect the journal, or debug why a run stopped at a gate.

---

## Next steps

- **See where it sits:** [Architecture & How It Fits Together](../architecture.md)
- **What it streams:** [Journal System](../features/journal-system.md)
- **Launch it from a harness:** [Slash Commands](../reference/slash-commands.md) (`/babysitter:observe`)
- **Ecosystem map:** [Ecosystem Overview](./overview.md)
