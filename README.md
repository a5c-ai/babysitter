<div align="center">

# Babysitter

https://a5c.ai

---

[![npm version](https://img.shields.io/npm/v/@a5c-ai/babysitter-sdk.svg)](https://www.npmjs.com/package/@a5c-ai/babysitter-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/issues)
[![GitHub stars](https://img.shields.io/github/stars/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/stargazers)

> **Orchestrate complex, multi-step workflows with process-driven execution, human-in-the-loop approval, and quality gates.**

[Getting Started](#installation) | [Documentation](#documentation) | [Community](#community-and-support)

</div>

---

https://github.com/user-attachments/assets/8c3b0078-9396-48e8-aa43-5f40da30c20b

---

## Table of Contents

- [What is Babysitter?](#what-is-babysitter)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [First Steps](#first-steps)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Why Babysitter?](#why-babysitter)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Community and Support](#community-and-support)
- [License](#license)

---

## What is Babysitter?

Babysitter is an orchestration framework for Claude Code that enables deterministic, process-driven workflow management. Define your workflow in code, and Babysitter enforces every step - quality gates must pass before progression, breakpoints require human approval, and every decision is recorded in an immutable journal. Babysitter works seamlessly with your existing subagents, skills, and tools, orchestrating them into sophisticated workflows.

---

## Prerequisites

- **Node.js**: Version 20.0.0+ (22.x LTS recommended)
- **Claude Code**: Latest version ([docs](https://code.claude.com/docs/en/quickstart))
- **Git**: For cloning (optional)

---

## Installation

### 1. Install the Plugin

```bash
claude plugin marketplace add a5c-ai/babysitter
claude plugin install --scope user babysitter@a5c.ai
```

Then restart Claude Code.

### 2. Verify Installation

Type `/skills` in Claude Code to verify "babysit" appears.

### Codex CLI Integration (babysitter-codex)

Codex support is available as a dedicated plugin bundle in:

`plugins/babysitter-codex`

It includes Codex hook wiring, slash command dispatch, and orchestration harness scripts compatible with the Babysitter SDK.

---

## First Steps

After installation, set up your environment:

### 1. Configure Your Profile (One-Time)

```bash
/babysitter:user-install
```

This creates your personal profile with:
- Breakpoint preferences (how much oversight you want)
- Tool preferences and communication style
- Expertise areas for better process matching

### 2. Set Up Your Project

```bash
/babysitter:project-install
```

This analyzes your codebase and configures:
- Project-specific workflows
- Test frameworks and CI/CD integration
- Tech stack preferences

### 3. Verify Setup

```bash
/babysitter:doctor
```

Run diagnostics to confirm everything is working.

---

## Quick Start

```bash
claude "/babysitter:call implement user authentication with TDD"
```

Or in natural language:

```
Use the babysitter skill to implement user authentication with TDD
```

Claude will create an orchestration run, execute tasks step-by-step, handle quality checks and approvals, and continue until completion.

### Choose Your Mode

| Mode | Command | When to Use |
|------|---------|-------------|
| **Interactive** | `/babysitter:call` | Learning, critical workflows - pauses for approval |
| **Autonomous** | `/babysitter:yolo` | Trusted tasks - full auto, no breakpoints |
| **Planning** | `/babysitter:plan` | Review process before executing |
| **Continuous** | `/babysitter:forever` | Monitoring, periodic tasks - runs indefinitely |

### Utility Commands

| Command | Purpose |
|---------|----------|
| `/babysitter:doctor` | Diagnose run health and issues |
| `/babysitter:observe` | Launch real-time monitoring dashboard |
| `/babysitter:resume` | Continue an interrupted run |
| `/babysitter:help` | Documentation and usage help |

---

## How It Works

```
+=============================================================================+
|                         /babysitter:call                                    |
+=============================================================================+
|                                                                             |
|   YOUR PROCESS (JavaScript)                   This is the AUTHORITY         |
|   +----------------------------------------+                                |
|   | async function process(inputs, ctx) {  |  Real code, not config.       |
|   |                                        |  The orchestrator can ONLY    |
|   |   await ctx.task(plan, { ... });       |  do what this code permits.   |
|   |                                        |                                |
|   |   await ctx.breakpoint({               |  Breakpoints = human gates    |
|   |     question: 'Approve plan?'          |  (enforced, not optional)     |
|   |   });                                  |                                |
|   |                                        |                                |
|   |   await ctx.task(implement, { ... });  |  Tasks = executable work      |
|   |                                        |                                |
|   |   const score = await ctx.task(verify);|  Quality gates = code logic   |
|   |   if (score < 80)                      |  (not config, real checks)    |
|   |     await ctx.task(refine, { ... });   |                                |
|   | }                                      |                                |
|   +-------------------+--------------------+                                |
|                       |                                                     |
|                       | governs                                             |
|                       v                                                     |
|   +---------------------------------------------------------------------+   |
|   |                      ENFORCEMENT MECHANISM                          |   |
|   |                                                                     |   |
|   |   +-------------+     +------------------+     +-----------------+  |   |
|   |   | MANDATORY   |---->| PROCESS CHECK    |---->| DECISION        |  |   |
|   |   | STOP        |     | What does the    |     |                 |  |   |
|   |   | (enforced   |     | process permit   |     | Permitted: next |  |   |
|   |   |  by hook)   |     | next?            |     | task assigned   |  |   |
|   |   +-------------+     +------------------+     |                 |  |   |
|   |                              |                 | Blocked: halt   |  |   |
|   |                              v                 | until gate      |  |   |
|   |                       +--------------+        | passes          |  |   |
|   |                       | Gate/task    |        +-----------------+  |   |
|   |                       | from code    |                              |   |
|   |                       +--------------+                              |   |
|   +---------------------------------------------------------------------+   |
|                       |                                                     |
|                       | records every decision                              |
|                       v                                                     |
|   +---------------------------------------------------------------------+   |
|   |   JOURNAL: Every task, gate, decision - immutable, replayable       |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
+=============================================================================+
```

**The difference from simple iteration:**
- **Process as Code:** Your workflow is JavaScript - the orchestrator can ONLY do what this code permits
- **Mandatory Stop:** Claude cannot "keep running" - every step ends with a forced stop, then the process decides what's next
- **Enforcement, not Assistance:** Gates block progression until satisfied - they're not suggestions
- **Event-Sourced Journal:** All state in `.a5c/runs/` - deterministic replay and resume from any point

---

## Why Babysitter?

| Traditional Approach | Babysitter |
|---------------------|------------|
| Run script once, hope it works | Process enforces quality gates before completion |
| Manual approval via chat | Structured breakpoints with context |
| State lost on session end | Event-sourced, fully resumable |
| Single task execution | Parallel execution, dependencies |
| No audit trail | Complete journal of all events |
| Ad-hoc workflow | Deterministic, code-defined processes |

**Key differentiators:** Process enforcement, deterministic replay, quality convergence, human-in-the-loop breakpoints, and parallel execution.

---

## Documentation

### Getting Started
- [Quickstart Guide](docs/user-guide/getting-started/quickstart.md)
- [Beginner Tutorial: REST API](docs/user-guide/tutorials/beginner-rest-api.md)
- [Best Practices](docs/user-guide/BEST-PRACTICES.md)

### Features
- [Process Library](docs/user-guide/features/process-library.md) - 2,000+ pre-built processes
- [Process Definitions](docs/user-guide/features/process-definitions.md)
- [Quality Convergence](docs/user-guide/features/quality-convergence.md)
- [Run Resumption](docs/user-guide/features/run-resumption.md)
- [Journal System](docs/user-guide/features/journal-system.md)
- [Best Practices](docs/user-guide/features/best-practices.md)
- [Architecture Overview](docs/user-guide/features/architecture-overview.md)

### Reference
- [FAQ](docs/user-guide/reference/faq.md)
- [Troubleshooting](docs/user-guide/reference/troubleshooting.md)
- [Security](docs/user-guide/reference/security.md)
- [CLI Reference](docs/user-guide/reference/cli-reference.md)

---

## Contributing

We welcome contributions! Here's how you can help:

- **Report bugs**: [GitHub Issues](https://github.com/a5c-ai/babysitter/issues)
- **Suggest features**: Share your ideas for improvements
- **Submit pull requests**: Fix bugs or add features
- **Improve documentation**: Help make docs clearer

See [CONTRIBUTING.md](https://github.com/a5c-ai/babysitter/blob/main/CONTRIBUTING.md) for detailed guidelines.

---

## Community and Support

- **Discord**: [Join our community](https://discord.gg/dHGkzxf48a) *(GitHub invite link)*
- **GitHub Issues**: [Report bugs or request features](https://github.com/a5c-ai/babysitter/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/a5c-ai/babysitter/discussions)
- **npm**: [@a5c-ai/babysitter-sdk](https://www.npmjs.com/package/@a5c-ai/babysitter-sdk)

### Community Tools

| Tool | Description |
|------|-------------|
| [Observer Dashboard](https://github.com/yoavmayer/babysitter-observer-dashboard) | Real-time monitoring UI for parallel runs |
| [Telegram Bot](https://github.com/a5c-ai/claude-code-telegram-bot) | Control sessions remotely |
| [vibe-kanban](https://github.com/BloopAI/vibe-kanban) | Parallel process management |

### Star History

<a href="https://star-history.com/#a5c-ai/babysitter&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=a5c-ai/babysitter&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=a5c-ai/babysitter&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=a5c-ai/babysitter&type=Date" />
 </picture>
</a>

### Contributors

<a href="https://github.com/a5c-ai/babysitter/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=a5c-ai/babysitter" />
</a>

---

## License

This project is licensed under the **MIT License**. See [LICENSE.md](https://github.com/a5c-ai/babysitter/blob/main/LICENSE.md) for details.

---

<div align="center">

**Built with Claude by A5C AI**

[Back to Top](#babysitter)

</div>
