---
title: Babysitter User Guide
description: Comprehensive documentation for Babysitter - deterministic, obedient orchestration of complex agentic workflows across any AI coding harness, with enforcement (not assistance) at every step
category: landing
last_updated: 2026-06-23
---

# Babysitter User Guide

**Babysitter enforces obedience on agentic workforces: it runs your workflow as deterministic, code-defined orchestration on any supported harness, where the orchestrator can only do what your process permits. Manage extremely complex, multi-agent workflows with a hook-enforced mandatory stop after every step — enforcement, not assistance.**

New here? Jump straight to [Start here](#start-here) for the 20-minute path, or use the [task-based](#i-want-to) and [role-based](#by-role-and-level) entry points below to go directly to the page you need.

---

## Start here

The fastest path from zero to a working run:

1. [Installation](./getting-started/installation.md) — install the CLI and your harness plugin (5 min)
2. [Quickstart](./getting-started/quickstart.md) — run your first workflow (10 min)
3. [First Run Deep Dive](./getting-started/first-run.md) — understand what just happened (10 min)

Prefer to learn the ideas first? Read [What is Babysitter?](#what-is-babysitter-start-here-if-youre-new) (2 min), then see **[how the whole ecosystem fits together](./architecture.md)** (vision + diagram + runtime flow) and the [Two-Loops Architecture](./features/two-loops-architecture.md).

Want the lay of the land first? The [Ecosystem Overview](./ecosystem/overview.md) tours every component (the core engine, the adapters family, atlas, genty, the observer dashboard, kradle, and kip-sdk) and helps you choose which you need.

---

## I want to…

Task-based entry points — pick the goal that matches what you are doing right now.

| I want to… | Go to |
|------------|-------|
| **Create a process** (custom workflow) | [Process Definitions](./features/process-definitions.md) → [Custom Process tutorial](./tutorials/intermediate-custom-process.md) |
| **Run on my harness** (Codex, Cursor, Gemini, …) | [Install Matrix](./harnesses/install-matrix.md) → [Slash Commands](./reference/slash-commands.md) |
| **Debug a run** (errors, stuck runs, recovery) | [Troubleshooting](./reference/troubleshooting.md) → [Error Catalog](./reference/error-catalog.md) |
| **Write tests / set quality targets** | [Quality Convergence](./features/quality-convergence.md) → [Best Practices](./features/best-practices.md) |
| **Understand the architecture** | [Architecture & How It Fits Together](./architecture.md) → [Two-Loops Architecture](./features/two-loops-architecture.md) |
| **Tour the components** | [Ecosystem Overview](./ecosystem/overview.md) → [Adapter Types](./reference/adapter-types.md) |
| **Run Babysitter from CI** | [Adapters CLI](./reference/adapters-cli.md) → [Configuration](./reference/configuration.md) |
| **Look up a command or flag** | [CLI Reference](./reference/cli-reference.md) · [Adapters CLI](./reference/adapters-cli.md) |
| **Learn a term** | [Glossary](./reference/glossary.md) |

---

## By role and level

Role-based entry points — start where you fit, then follow the detailed [Learning Paths](#learning-paths) below.

| You are a… | Start with |
|------------|-----------|
| **New user** (first time) | [Getting Started overview](./getting-started/README.md) → [Quickstart](./getting-started/quickstart.md) |
| **Process author** (build workflows) | [Process Definitions](./features/process-definitions.md) → [Custom Process tutorial](./tutorials/intermediate-custom-process.md) |
| **CI / automation integrator** | [Adapters CLI](./reference/adapters-cli.md) → [Configuration](./reference/configuration.md) → [Security](./reference/security.md) |
| **Technical lead / architect** | [Two-Loops Architecture](./features/two-loops-architecture.md) → [Best Practices](./features/best-practices.md) |

---

## Quick Start

Get up and running with Babysitter in minutes.

| Step | Description | Time |
|------|-------------|------|
| [Installation](./getting-started/installation.md) | Install the CLI and Claude Code plugin | 5 min |
| [Quickstart](./getting-started/quickstart.md) | Configure your environment | 5 min |
| [First Run](./getting-started/first-run.md) | Execute your first babysitter workflow | 10 min |

---
## What is Babysitter? (Start Here if You're New)

**Babysitter makes agentic work obedient.** It rests on three pillars:

1. **Deterministic process execution** — your workflow is real JavaScript code (`async function process(inputs, ctx)`), and the orchestrator can *only* do what that code permits. State is event-sourced in an immutable journal, so any run can be replayed and resumed from any point.
2. **Complex agentic workflows** — tasks, breakpoints, sleeps, parallel dispatch, dependencies, and sub-agent delegation across harnesses. A single headless entry point can orchestrate multi-agent work, delegating each task to whichever installed harness is best suited.
3. **Policy / process adherence (obedience)** — after *every* step there is a hook-enforced **mandatory stop**, a process check ("what does the process permit next?"), and a decision: permit the next task, or halt until a gate passes. **Enforcement, not assistance — gates block progression until satisfied; they're not suggestions.**

### The Problem Babysitter Solves

When you turn an AI agent loose on real work, it tends to keep going on its own judgment — skipping steps, declaring "done" without evidence, and drifting from the process you intended. Babysitter removes that discretion: the agent does exactly what the process permits, nothing more, and cannot advance past a gate it hasn't satisfied.

One illustration of how a gate works is the familiar "try, check, fix, repeat" loop — a code-defined gate keeps iterating until its quality criterion is met, then permits the next step. That quality convergence is *one* consequence of code-defined gates, not the whole product.

### How It Works (In Plain English)

Your process is code; the orchestrator enforces it. After each step it stops, checks what the process permits next, and only then permits the next task — or halts until a gate passes. The loop below shows one such gate (a quality gate) doing its job:

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU: "Build a login page with tests"                           │
│                         ↓                                       │
│  BABYSITTER: Enforces your process; one gate iterates:          │
│    1. AI writes code                                            │
│    2. Tests run → 60% pass                                      │
│    3. AI fixes failures                                         │
│    4. Tests run → 85% pass                                      │
│    5. AI fixes remaining issues                                 │
│    6. Tests run → 95% pass ✓ Target met!                       │
│                         ↓                                       │
│  YOU: Review and approve the final result                       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Terms You'll See

| Term | What It Means | Example |
|------|---------------|---------|
| **Process** | A workflow definition | "Build feature with TDD" |
| **Run** | One execution of a process | Running the TDD workflow for your login page |
| **Task** | A single step in the process | "Write tests", "Run linter", "Check coverage" |
| **Quality Gate** | A check that must pass | Tests must be 90% passing |
| **Breakpoint** | A pause for human approval | "Review this code before I deploy it" (handled in chat or via web UI) |
| **Iteration** | One try-check-fix cycle | Attempt #3 to pass the tests |
| **Convergence** | Improving until target met | Going from 60% → 85% → 95% |

### Your First 5 Minutes

**What you'll do:**
1. Install Babysitter (1 command)
2. Run a simple workflow (1 command)
3. See it iterate until tests pass
4. Approve the result

**What you'll learn:**
- How the orchestrator only does what your process permits
- What the mandatory stop and process check do after each step
- How to approve at breakpoints
- What a quality gate looks like (one gate type among several)

**What you'll see:**

```
/babysitter:call build a calculator with add, subtract, multiply, divide using TDD

Creating run: calculator-20260125-143012
Process: TDD Quality Convergence
Target: 90% quality

Iteration 1: Quality 65/100 - Tests: 6/10 passing
  → AI fixing test failures...

Iteration 2: Quality 82/100 - Tests: 9/10 passing
  → AI improving code coverage...

Iteration 3: Quality 95/100 - Target met! ✅

Claude: The implementation is complete. Quality score: 95/100.
        Do you approve the final result?
        [Approve] [Request Changes]

You: [Approve]

Done! Your calculator module is ready.
```

**Note:** Breakpoints (approval prompts) are handled directly in the chat when using Claude Code. No external service needed!

**The main command:** `/babysitter:call <your request>` handles everything automatically.

→ **[Start the Quick Start Tutorial](./getting-started/quickstart.md)**

---

## Documentation Sections

### Ecosystem & Architecture

The monorepo is one core engine surrounded by a family of components. Start with the architecture, then tour each piece.

| Page | Description |
|------|-------------|
| [Architecture & How It Fits Together](./architecture.md) | Vision, a component diagram, and the runtime flow — how the engine, adapters, atlas, genty, kradle, and the dashboard cooperate |
| [Ecosystem Overview](./ecosystem/overview.md) | The whole monorepo and how to choose among components |
| [babysitter-sdk](./ecosystem/babysitter-sdk.md) | The core event-sourced orchestration engine (GA) |
| [adapters (the family)](./ecosystem/adapters.md) | The multiplexer for all agents — a family of 20 package types, not one thing |
| [atlas](./ecosystem/atlas.md) | The catalog / knowledge graph and `atlas` CLI (GA) |
| [genty](./ecosystem/genty.md) | The unified agent runtime and `genty` CLI (GA) |
| [observer-dashboard](./ecosystem/observer-dashboard.md) | Real-time SSE run dashboard (GA) |
| [kradle](./ecosystem/kradle.md) | Kubernetes-native Git forge with per-org assistant (**MVP**) |
| [kip-sdk](./ecosystem/kip-sdk.md) | Intended memory substrate — **spec/design only, no shipping code** |

---

### Tutorials

Step-by-step learning guides that take you from beginner to expert.

| Tutorial | Level | Time | Description |
|----------|-------|------|-------------|
| [Getting Started](./getting-started/README.md) | Beginner | 20 min | Installation, setup, and your first run |
| [Build a REST API](./tutorials/beginner-rest-api.md) | Beginner | 45 min | Create a complete REST API with TDD |
| [Custom Process](./tutorials/intermediate-custom-process.md) | Intermediate | 60 min | Build your own process definition |
| [Multi-Phase Workflows](./tutorials/advanced-multi-phase.md) | Advanced | 90 min | Orchestrate complex multi-phase development |

---

### Features

Deep dives into Babysitter's core capabilities.

<!-- user-guide-index:features-table:start -->
| Feature | Description |
|---------|-------------|
| [**Two-Loops Architecture**](./features/two-loops-architecture.md) | **Deterministic enforcement** - a symbolic orchestrator that can only do what your code permits, with a mandatory stop after every step (enforcement, not assistance) |
| [**Process Definitions**](./features/process-definitions.md) | **Workflows as real JavaScript** - tasks, breakpoints, sleeps, parallel dispatch, dependencies, and sub-agent delegation orchestrated from code |
| [**Adapters**](./features/adapters.md) | **Run complex agentic workflows on any supported harness** (v6) - harness-agnostic runtime, sub-agent delegation across harnesses, plus the host-side `adapters` CLI |
| [**Journal System**](./features/journal-system.md) | **Event-sourced, immutable journal** - deterministic replay and resume from any point |
| [**Process Library**](./features/process-library.md) | **2,239 JavaScript process files in the live generated snapshot**, plus methodology, shared-process, skill, and agent layers discovered under `library/` |
| [Breakpoints](./features/breakpoints.md) | Human-in-the-loop approval gates - enforced pauses for critical decisions |
| [Parallel Execution](./features/parallel-execution.md) | Concurrent task execution and dependencies for faster results |
| [Run Resumption](./features/run-resumption.md) | Continue interrupted workflows from any point via journal replay |
| [Quality Convergence](./features/quality-convergence.md) | One gate type among several - **five quality gate categories** (tests, code quality, static analysis, security, performance) with 90-score patterns; a consequence of code-defined gates |
| [Best Practices](./features/best-practices.md) | **Four guardrail layers**, multi-gate validation, workflow design, and team collaboration patterns |
<!-- user-guide-index:features-table:end -->

<!-- user-guide-index:process-library-highlight:start -->
> **Highlight:** The Process Library snapshot currently tracks 2,239 process files across 38 methodology families and the full specialization tree. [Explore the library →](./features/process-library.md)
<!-- user-guide-index:process-library-highlight:end -->

> **Essential Reading:** Understanding the [Two-Loops Architecture](./features/two-loops-architecture.md) is key to designing reliable, bounded agentic workflows with proper guardrails and evidence-driven completion. For how the v6 subsystems fit together, start with the [Architecture Overview](./features/architecture-overview.md).

---

### Harnesses

Babysitter v6 runs on a dozen AI coding harnesses. Pick yours and follow its install and invocation guide.

| Harness | Description |
|---------|-------------|
| [Install Matrix](./harnesses/install-matrix.md) | Every supported harness - install commands, invocation token, and per-harness hook model |
| [Claude Code](./harnesses/claude-code.md) | Fully supported - `/babysitter:*` slash-commands and the `babysit` skill |
| [Codex](./harnesses/codex.md) | Fully supported - `$babysitter:*` via the mention picker |

> Migrating from the `0.0.x` series? See the [Migration Guide](./getting-started/migration.md) for every breaking change.

---

### Reference

Technical specifications and lookup resources.

| Reference | Description |
|-----------|-------------|
| [Slash Commands](./reference/slash-commands.md) | **Core modes** (call, yolo, forever, plan) and utility commands for Claude Code |
| [CLI Reference](./reference/cli-reference.md) | Complete command-line interface documentation |
| [Adapters CLI](./reference/adapters-cli.md) | The host-side `adapters` CLI - run, install, and manage any harness (v6) |
| [Package & Plugin Map](../package-and-plugin-map.md) | Canonical public/internal docs map for active packages, apps, and harness plugins |
| [Configuration](./reference/configuration.md) | Environment variables and config file options |
| [Security](./reference/security.md) | Security model, trust boundaries, and hardening guidance |
| [Error Catalog](./reference/error-catalog.md) | All error codes with solutions |
| [Glossary](./reference/glossary.md) | Terminology and definitions |
| [FAQ](./reference/faq.md) | Frequently asked questions |
| [Troubleshooting](./reference/troubleshooting.md) | Common issues and resolutions |

---

## Learning Paths

Choose a path based on your role and goals.

### For Developers New to Babysitter

**Start here if this is your first time using Babysitter:**

1. **First:** Read the ["What is Babysitter?" section](#what-is-babysitter-start-here-if-youre-new) above - it takes 2 minutes and explains the core concepts
2. **Then:** Complete the [Getting Started](./getting-started/README.md) tutorial (20 min) - you'll install and run your first workflow
3. **Practice:** Build your first project with [REST API Tutorial](./tutorials/beginner-rest-api.md) (45 min)
4. **Reference:** Use the [Glossary](./reference/glossary.md) when you encounter unfamiliar terms (it has a quick-reference table at the top)

### For Experienced Developers

1. Quick setup via [Installation](./getting-started/installation.md)
2. Learn the [Five Quality Gate Types](./features/quality-convergence.md#the-five-quality-gate-categories) for robust validation
3. Study [Best Practices](./features/best-practices.md) for workflow design
4. Reference the [CLI](./reference/cli-reference.md) for automation

### For Technical Leads and Architects

1. **Start here:** Understand the [Two-Loops Architecture](./features/two-loops-architecture.md) philosophy
2. Study [Quality Convergence](./features/quality-convergence.md) for the 90-score convergence pattern
3. Review the [Four Guardrail Layers](./features/best-practices.md#the-four-guardrail-layers) for safety and control
4. Learn [Journal System](./features/journal-system.md) for audit compliance
5. Explore [Custom Process](./tutorials/intermediate-custom-process.md) for team workflows

### For Quality Engineers

1. **Essential:** Study the [Five Quality Gate Types](./features/quality-convergence.md#the-five-quality-gate-categories)
2. Review [The 90-Score Convergence Pattern](./features/quality-convergence.md#the-90-score-quality-convergence-pattern)
3. Understand [Evidence-Driven Completion](./features/two-loops-architecture.md#quality-gates-turning-agentic-work-into-reliable-outcomes)
4. Apply [Domain-Specific Targets](./features/best-practices.md) from Best Practices

### For DevOps and Automation Engineers

1. Install using [Quickstart](./getting-started/quickstart.md)
2. Master the [CLI Reference](./reference/cli-reference.md)
3. Configure via [Configuration Reference](./reference/configuration.md)
4. Automate with [Run Resumption](./features/run-resumption.md)

---

## What's New

### Version 5.1.0

- v6 launch edition: documented the harness-agnostic Adapters runtime across all 12 supported harnesses
- Unified the public npm surface around `@a5c-ai/babysitter` for the main CLI
- Split optional runtime orchestration into `@a5c-ai/genty-platform`
- Refreshed user-facing docs to match the current package and command boundaries

### Recent Updates

| Version | Date | Highlights |
|---------|------|------------|
| 5.1.0 | 2026-06-22 | v6 launch edition: harness-agnostic Adapters runtime documented across 12 harnesses |
| 5.0.0 | 2026-04-25 | CLI/runtime package split clarified across public docs |

For the complete changelog, see the [GitHub Releases](https://github.com/a5c-ai/babysitter/releases).

---

## Search Tips

Finding what you need quickly:

- **Commands:** Search for the command name (e.g., `run:create`, `effects:get`)
- **Errors:** Search for the error code or key words from the message
- **Concepts:** Use terms from the [Glossary](./reference/glossary.md)
- **Tasks:** Search for what you want to do (e.g., "resume", "breakpoint", "quality")

---

## Getting Help

### Documentation Resources

- [FAQ](./reference/faq.md) - Common questions answered
- [Troubleshooting](./reference/troubleshooting.md) - Problem resolution guides
- [Error Catalog](./reference/error-catalog.md) - Error codes and fixes

### Community and Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/a5c-ai/babysitter/issues)
- **Discussions:** [Community Q&A and discussions](https://github.com/a5c-ai/babysitter/discussions)

---

## Documentation Structure

This documentation follows the [Diataxis framework](https://diataxis.fr/):

| Category | Purpose | User Mode |
|----------|---------|-----------|
| **Tutorials** | Learning through guided projects | Study |
| **Features** | Understanding capabilities | Study |
| **Reference** | Technical lookup information | Work |
| **How-to Guides** | Task-focused problem solving | Work |

---

## Contributing

Found an issue with the documentation? Contributions are welcome.

1. Check existing [issues](https://github.com/a5c-ai/babysitter/issues) first
2. Submit corrections via pull request
3. Follow the documentation style guide

---

*Last updated: 2026-06-23*
