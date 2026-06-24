---
title: Getting Started
description: Install Babysitter, configure your environment, and understand your first run.
last_updated: 2026-06-23
category: landing
---

[Docs](../index.md) › Getting Started

# Getting Started with Babysitter

**Welcome to Babysitter!** This guide will help you go from zero to running your first AI-orchestrated development workflow in just a few minutes.

## On this page

- [30-Second Overview](#30-second-overview)
- [Choose Your Path](#choose-your-path)
- [What is Babysitter?](#what-is-babysitter)
- [Prerequisites](#prerequisites)
- [Installation Overview](#installation-overview)
- [How Babysitter Works (The Big Picture)](#how-babysitter-works-the-big-picture)
- [Getting Help](#getting-help)

> **Source-of-truth precedence:** When docs disagree, the reference docs win. The [CLI Reference](../reference/cli-reference.md), [Adapters CLI](../reference/adapters-cli.md), and [Configuration Reference](../reference/configuration.md) are authoritative over tutorials, quickstarts, and archived material. If a tutorial conflicts with a reference page, trust the reference.

> **Works on any harness:** Babysitter is harness-agnostic. It runs across 12 supported AI coding harnesses, not just Claude Code. The examples below use Claude Code's `/babysitter:call` command, but the same workflow runs on every supported harness with its own command token. See the [Install Matrix](../harnesses/install-matrix.md) and the [Adapters guide](../features/adapters.md) for details.

---

## 30-Second Overview

**Babysitter = deterministic, obedient orchestration of your AI coding harness**

Your workflow is real code, and the orchestrator can only do what that code permits. After every step it stops, checks what the process allows next, and either permits the next task or halts until a gate passes. Enforcement, not assistance.

Instead of:
```
You: "Build me a login page"
Claude: *builds something, decides on its own it's done*
You: "Wait, you skipped the tests"
Claude: *backtracks*
You: "Now run them"
... (you babysit it by hand for hours)
```

You define the process once and say:
```
/babysitter:call build a login page
```

Babysitter then enforces that process step by step — running tasks, pausing at breakpoints for your approval, and blocking progression at any gate (including quality gates) until it's satisfied. Come back later, it's still working (or waiting for your approval), exactly where the process left it.

---

## Choose Your Path

| If you are... | Start here |
|--------------|------------|
| **Impatient** (just want to try it) | [Quickstart](./quickstart.md) - 10 minutes to first run |
| **Thorough** (want to understand first) | Keep reading this page, then [Installation](./installation.md) |
| **Already installed** | [First Run Deep Dive](./first-run.md) to understand what happened |
| **Coming back** | Jump to the [Tutorials](../tutorials/) for deeper projects |
| **On a different harness** | Check the [Install Matrix](../harnesses/install-matrix.md) for your harness's setup and command token |

---

## What is Babysitter?

Babysitter is an **orchestration framework** for AI coding harnesses that enforces obedience on agentic work. It runs across 12 supported harnesses (see the [Install Matrix](../harnesses/install-matrix.md)) via its harness-agnostic [Adapters](../features/adapters.md) layer. Instead of trusting an agent's own judgment about what to do and when it's done, Babysitter makes it follow a process you define. The triad:

- **Deterministic process execution** - Your workflow is real JavaScript code; the orchestrator can only do what that code permits, and every run is event-sourced for deterministic replay and resume from any point
- **Complex agentic workflows** - Tasks, breakpoints, sleeps, parallel dispatch, dependencies, and sub-agent delegation across harnesses, all orchestrated from a single entry point
- **Policy / process adherence (obedience)** - A hook-enforced mandatory stop after every step, a process check, and a decision: permit the next task or halt until a gate passes. Enforcement, not assistance

Alongside the triad you also get **human-in-the-loop breakpoints**, **complete audit trails** in an event [journal](../reference/glossary.md), and **quality convergence** as one of the gate types you can encode. Think of Babysitter as a process foreman for your AI coding sessions - it never lets the agent skip a step, and never loses context.

### Why You Will Love Babysitter

| Without Babysitter | With Babysitter |
|-------------------|-----------------|
| Agent decides on its own what to do and when it's "done" | Orchestrator can only do what your process code permits |
| Hope the AI followed the steps you wanted | Mandatory stop + process check after every step — enforcement, not assistance |
| Lose all context when session ends | Deterministic replay; resume from any point, even days later |
| Hope the AI made good decisions | Review and approve at enforced breakpoints |
| Run tasks one at a time | Parallel execution and sub-agent delegation for faster results |
| "Claude, can you improve that?" (repeat 10x) | Encode a quality gate once; it iterates automatically |

---

## Key Benefits

### 1. Deterministic, Enforced Execution
Your workflow is real code; the orchestrator can only do what that code permits. A hook-enforced mandatory stop after every step means the agent cannot "keep running" on its own — the process decides what's next. Enforcement, not assistance.

```
# The agent does exactly what the process permits, nothing more
claude "/babysitter:call implement user auth with TDD"
```

### 2. Complex Agentic Workflows
Tasks, breakpoints, sleeps, parallel dispatch, dependencies, and sub-agent delegation across harnesses — orchestrate multi-agent work from a single entry point.

```
# One entry point, many delegated tasks
claude "/babysitter:call build and test the API, then prepare a deploy plan"
```

### 3. Never Lose Progress (Deterministic Replay)
Every action is recorded in an event-sourced, immutable journal. Session interrupted? Replay the journal and resume exactly where you left off.

```
# Resume exactly where you left off
claude "Resume the babysitter run for the auth feature"
```

### 4. Human-in-the-Loop Control
Add approval gates for critical decisions. Review context, approve or reject, and only then does execution continue.

```
# Babysitter will pause for approval before deploying
claude "/babysitter:call deploy to production with breakpoint approval"
```

### 5. Quality Convergence (One Gate Type Among Several)
Because gates are code, you can encode a quality gate: define a target (test coverage, code standards, etc.) and the gate iterates until it's met before permitting the next step.

```
# Example: a quality gate iterates until 85% quality score
claude "/babysitter:call implement user auth with TDD, 85% quality target"
```

### 6. Structured Workflows
Choose from built-in methodologies (TDD, Spec-Kit, GSD) or create your own. Consistent, repeatable processes across your team.

---

## Quick Navigation

| I want to... | Go to... |
|-------------|----------|
| Install Babysitter | [Installation Guide](./installation.md) |
| Run my first workflow (5 min) | [Quickstart](./quickstart.md) |
| Understand what happened | [First Run Deep Dive](./first-run.md) |
| See all commands | [CLI Reference](../reference/cli-reference.md) |
| Learn about Quality Convergence | [Quality Convergence Guide](../features/quality-convergence.md) |

---

## Prerequisites

Before you begin, ensure you have the following:

### Required Software

| Software | Version | How to Check | Installation Guide |
|----------|---------|--------------|-------------------|
| **Node.js** | 20.0.0+ (22.x recommended) | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | 8.0.0+ | `npm --version` | Comes with Node.js |
| **Claude Code** | Latest | `claude --version` | [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code) |

### Recommended (for best experience)

| Software | Purpose | Installation |
|----------|---------|--------------|
| **nvm** | Manage Node.js versions easily | [nvm-sh/nvm](https://github.com/nvm-sh/nvm) |
| **Git** | Version control for your projects | [git-scm.com](https://git-scm.com/) |
| **jq** | Parse JSON output from CLI | `brew install jq` (macOS) |

### Knowledge Prerequisites

| Level | What You Should Know |
|-------|---------------------|
| **Required** | Basic command line usage (cd, ls, npm) |
| **Required** | How to use Claude Code (basic prompting) |
| **Helpful** | JavaScript/TypeScript basics (for custom processes) |
| **Optional** | Test-driven development concepts |

### Verify Your Environment

Run these commands to confirm you're ready:

```bash
# Check Node.js (need 20.0.0+)
node --version
# Expected: v20.x.x or v22.x.x

# Check npm
npm --version
# Expected: 8.x.x or higher

# Check Claude Code
claude --version
# Expected: Claude Code version info
```

If any command fails, install the missing software before continuing.

---

## Installation Overview

Getting Babysitter running involves three steps:

1. **Install the harness plugin** for your AI coding harness (each supported harness has its own plugin — Claude Code uses its plugin system; see the [Install Matrix](../harnesses/install-matrix.md) for the others)
2. **Install the CLI packages** (npm global install for the core `babysitter` CLI and the host-side `adapters` CLI)
3. **Verify the installation** (run `babysitter --version` and `adapters doctor`)

**Estimated time:** 5-10 minutes

Ready? Head to the [Installation Guide](./installation.md) for step-by-step instructions.

---

## Your Learning Path

### Day 1: Get Started (Today!)

1. [x] Read this introduction (you are here)
2. [ ] [Install Babysitter](./installation.md) (5 min)
3. [ ] [Complete the Quickstart](./quickstart.md) (10 min)
4. [ ] [Understand your first run](./first-run.md) (10 min)

### Week 1: Build Confidence

5. [ ] Try different quality targets (80%, 90%, 95%)
6. [ ] Experience session resumption (close and resume a run)
7. [ ] Use breakpoints for approval workflows
8. [ ] Explore the [TDD methodology](../features/quality-convergence.md)

### Week 2+: Level Up

9. [ ] Compare methodologies (TDD, GSD, Spec-Kit)
10. [ ] Customize quality targets and iteration limits
11. [ ] Learn about parallel execution
12. [ ] Create your first custom process (advanced)

---

## How Babysitter Works (The Big Picture)

```
You: "Build a todo API with TDD"
         |
         v
+------------------+
|  Babysitter      |
|  Orchestration   |
|                  |
|  1. Research     |---> Analyze codebase
|  2. Plan         |---> Create specifications
|  3. Implement    |---> TDD iterations
|  4. Quality      |---> Score and improve
|  5. Approve      |---> Human checkpoint
|  6. Complete     |---> Deliver result
+------------------+
         |
         v
Everything logged to .a5c/runs/<runId>/journal/
```

### The Magic: Event-Sourced Persistence

Every action Babysitter takes is recorded as an event, one file per event under `journal/`:

```json
{"type":"RUN_CREATED","recordedAt":"2026-01-25T10:30:00Z","data":{"runId":"01KFFTSF8TK8C9GT3YM9QYQ6WG"}}
{"type":"EFFECT_REQUESTED","recordedAt":"2026-01-25T10:30:01Z","data":{"effectId":"research-001"}}
{"type":"EFFECT_RESOLVED","recordedAt":"2026-01-25T10:30:45Z","data":{"effectId":"research-001","status":"success"}}
```

This means:
- **Crash recovery:** Replay the journal to restore exact state
- **Audit trail:** Complete history of every decision
- **Debugging:** Trace exactly what happened and when

---

## What You Will Build

In this getting started guide, you will:

### Quickstart Tutorial (10 minutes)
Build a simple calculator module with TDD:
- Write tests first
- Implement code to pass tests
- Achieve 80% quality score
- See automatic iteration in action

### Expected Outcome
```
calculator/
  calculator.js      # Implementation
  calculator.test.js # Test suite
  README.md         # Generated documentation

Quality Score: 85/100
Tests: 12 passing
Coverage: 92%
```

---

## Getting Help

### Stuck? Try These Resources

| Resource | Best For |
|----------|----------|
| [Troubleshooting Guide](./installation.md#troubleshooting) | Installation issues |
| [FAQ](../reference/faq.md) | Common questions |
| [GitHub Issues](https://github.com/a5c-ai/babysitter/issues) | Bug reports |
| [GitHub Discussions](https://github.com/a5c-ai/babysitter/discussions) | Questions and ideas |

### Common First-Time Issues

| Problem | Solution |
|---------|----------|
| "command not found: babysitter" | Run `npm install -g @a5c-ai/babysitter` |
| Plugin not appearing | Restart Claude Code after installation |

---

## Quick Reference Card

Keep these commands handy:

```bash
# Start a new run
claude "/babysitter:call <your request>"

# Resume an existing run
claude "/babysitter:call resume the babysitter run"
# Check available skills
/skills

# View run history
ls .a5c/runs/
```

---

<div align="center">

**Ready to transform your AI-assisted development?**

[Start Installation](./installation.md)

</div>

---

## Next steps

- **Next:** [Installation](./installation.md) — get Babysitter running on your machine
- **Related:** [Quickstart](./quickstart.md) — run your first workflow in 10 minutes
- **Related:** [Install Matrix](../harnesses/install-matrix.md) — setup and command token for every supported harness
