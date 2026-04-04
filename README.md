<div align="center">

# Babysitter

https://a5c.ai

---

[![npm version](https://img.shields.io/npm/v/@a5c-ai/babysitter-sdk.svg)](https://www.npmjs.com/package/@a5c-ai/babysitter-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/issues)
[![GitHub stars](https://img.shields.io/github/stars/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/stargazers)

> **Enforce obedience to agentic workforces. Manage extremely complex workflows through deterministic, hallucination-free self-orchestration.**

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
- [Harness CLI Wrappers](#harness-cli-wrappers)
- [How It Works](#how-it-works)
- [Why Babysitter?](#why-babysitter)
- [Plugins](#plugins)
- [Compression](#compression)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Community and Support](#community-and-support)
- [License](#license)

---

## What is Babysitter?

Babysitter enforces obedience to agentic workforces, enabling them to manage extremely complex tasks and workflows through deterministic, hallucination-free self-orchestration. Define your workflow in code - Babysitter enforces every step, ensures quality gates pass before progression, requires human approval at breakpoints, and records every decision in an immutable journal. Your agents do exactly what the process permits, nothing more.

---

## Prerequisites

- **Node.js**: Version 20.0.0+ (22.x LTS recommended)
- **Claude Code**: Latest version ([docs](https://code.claude.com/docs/en/quickstart))
- **Git**: For cloning (optional)

---

## Installation

Babysitter supports multiple AI coding harnesses. Install the plugin for your harness of choice:

### Claude Code (recommended)

Native marketplace install:

```bash
claude plugin marketplace add a5c-ai/babysitter
claude plugin install --scope user babysitter@a5c.ai
```

Restart Claude Code, then type `/skills` to verify "babysit" appears.

[Plugin README](plugins/babysitter/README.md)

### Codex CLI (Beta)

After cloning this repo, From within the Codex CLI:

```
codex
> /plugins
```

Navigate to the "babysitter" entry and select "Install".

[Plugin README](plugins/babysitter-codex/README.md)

### Cursor IDE and CLI (Experimental)

Via the Cursor marketplace or npm:

```bash
npm install -g @a5c-ai/babysitter-cursor
```

[Plugin README](plugins/babysitter-cursor/README.md)

### Gemini CLI (Experimental)

```bash
npm install -g @a5c-ai/babysitter-gemini
babysitter-gemini install --global
```

[Plugin README](plugins/babysitter-gemini/README.md)

### GitHub Copilot (Experimental)

Via the GitHub Copilot CLI marketplace, or:

```bash
npm install -g @a5c-ai/babysitter-github
```

[Plugin README](plugins/babysitter-github/README.md)

### Pi (Experimental)

Native Pi plugin install:

```bash
pi install npm:@a5c-ai/babysitter-pi
```

[Plugin README](plugins/babysitter-pi/README.md)

### Oh-My-Pi (Experimental)

Native omp plugin install:

```bash
omp plugin install @a5c-ai/babysitter-omp
```

[Plugin README](plugins/babysitter-omp/README.md)

### OpenCode (Experimental)

```bash
npm install -g @a5c-ai/babysitter-opencode
```

The postinstall script copies the plugin to `.opencode/plugins/babysitter/` automatically.

[Plugin README](plugins/babysitter-opencode/README.md)

### Internal Harness (No AI Coding Agent Required)

Babysitter ships with a built-in **internal harness** that runs processes programmatically without any external AI coding agent. This is useful for CI/CD pipelines, scripts, automated testing, and headless orchestration:

```bash
npm install -g @a5c-ai/babysitter-sdk

# Run a process definition using the internal harness
babysitter harness:call --harness internal --process .a5c/processes/my-process.js#process --workspace .

# Or run a free-form prompt
babysitter harness:call --harness internal --prompt "run lint and tests" --workspace .
```

The internal harness uses the SDK's built-in Pi execution engine directly. It supports all capabilities (Programmatic, SessionBinding, StopHook, HeadlessPrompt) and requires no external CLI.

During process execution, the internal harness can **delegate tasks to any discovered installed harness** via the invoker. A process running under `--harness internal` can spawn subagent tasks that execute through Claude Code, Codex, Gemini CLI, or any other harness found on the system -- the SDK discovers available harness CLIs at runtime and routes task execution accordingly. This means you can orchestrate a multi-agent workflow from a single headless entry point, with different tasks delegated to whichever harness is best suited for them.

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

## Harness CLI Wrappers

Beyond the in-session skill commands (`/babysitter:call`, etc.), the Babysitter SDK provides `harness:*` CLI commands that let you create, run, and manage orchestration sessions from the terminal. These commands work with any installed harness.

### Running Processes via a Harness

```bash
# Run a process interactively via Claude Code (pauses at breakpoints)
babysitter harness:call --harness claude-code --prompt "implement user authentication with TDD" --workspace .

# Run fully autonomous (no breakpoints)
babysitter harness:yolo --harness claude-code --prompt "add pagination to the API" --workspace .

# Plan only (stops after Phase 1)
babysitter harness:plan --harness claude-code --prompt "implement feature X"

# Run with the internal harness (no external AI agent needed)
babysitter harness:call --harness internal --prompt "run lint and tests" --workspace .
```

### Managing Runs

```bash
# Resume an interrupted run
babysitter harness:resume --run-id <runId> --harness claude-code --workspace .

# Diagnose run health
babysitter harness:doctor --run-id <runId>

# Analyze past runs for insights
babysitter harness:retrospect --all --harness claude-code --workspace .

# Clean up old runs
babysitter harness:cleanup --keep-days 7 --harness claude-code --workspace .
```

### Harness Discovery

```bash
# See which harness CLIs are installed on your system
babysitter harness:discover

# Install a harness CLI
babysitter harness:install claude-code

# Install a harness plugin
babysitter harness:install-plugin claude-code
```

### Using `--harness internal` for Automation

The `internal` harness is particularly useful for CI/CD and scripting because it requires no external AI coding agent:

```bash
# In a CI pipeline or script
babysitter harness:call \
  --harness internal \
  --process .a5c/processes/lint-and-test.js#process \
  --workspace . \
  --no-interactive \
  --json
```

It executes processes using the SDK's built-in engine, supports all effect types (tasks, breakpoints, sleeps, parallel dispatch), and produces the same event-sourced journal as any other harness.

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


## Plugins

Babysitter has its own plugin system -- and it works differently from what you might expect. A babysitter plugin is not a code module with extension points. It's a **set of natural language instructions** (markdown files) or **deterministic coded processes** (JS files) that an AI agent reads and executes. The SDK stores, versions, and distributes the instructions. The AI agent is the runtime.

This means a plugin can do anything an AI agent can do: install npm packages, generate CI/CD pipelines, set up git hooks, create Terraform configs, modify your linter rules, copy babysitter processes into your project, and interview you about your preferences along the way.

The official marketplace includes plugins for **security** (gitleaks, ESLint security rules, audit processes), **testing** (Vitest/Playwright/pytest setup, coverage gates, TDD processes), **deployment** (Terraform, Helm, Dockerfiles, multi-environment pipelines), **themes** (sound effects, design systems, conversational personality), **CI/CD** (GitHub Actions workflows), and **rate limiting** (exponential backoff hooks).

To manage plugins, use the `/babysitter:plugins` command inside your harness (or `babysitter harness:plugins` from the CLI). The agent reads the plugin's install instructions, interviews you, analyzes your project, and executes the setup -- all within a babysitter orchestration run.

See the full [Plugins documentation](docs/plugins.md) for details on how installs work, the marketplace format, creating your own plugins, and the migration system.

---

## Compression

Babysitter includes a 4-layer token compression subsystem (built into `packages/sdk/`) that reduces context window usage by 50-67% on real sessions while maintaining 99% fact retention.

All compression hooks are **automatically registered** by the babysitter plugin -- no manual `settings.json` configuration needed. Install the plugin and compression is active.

### How It Works

| Layer | Hook | Engine | Content | Reduction |
|---|---|---|---|---|
| 1a | userPromptHook | density-filter | User prompts | ~29% |
| 1b | commandOutputHook | command-compressor | Bash/shell output | ~47% avg |
| 2 | sdkContextHook | sentence-extractor | Agent/task context | ~87% |
| 3 | processLibraryCache | sentence-extractor | Library files (pre-cached) | ~94% |

### Quick Toggle

```bash
# Disable all compression
export BABYSITTER_COMPRESSION_ENABLED=false

# Disable a single layer
babysitter compression:toggle sdkContextHook off

# Show current effective config
babysitter compression:config
```

### Config File

Edit `.a5c/compression.config.json` to persist settings (env vars always take priority):

```json
{
  "enabled": true,
  "layers": {
    "userPromptHook":    { "enabled": true, "threshold": 500, "keepRatio": 0.78 },
    "commandOutputHook": { "enabled": true, "excludeCommands": ["jq", "curl", "docker"] },
    "sdkContextHook":    { "enabled": true, "targetReduction": 0.15, "minCompressionTokens": 150 },
    "processLibraryCache": { "enabled": true, "targetReduction": 0.35, "ttlHours": 24 }
  }
}
```

Toggle any layer with `babysitter compression:toggle <layer> <on|off>` or set individual values with `babysitter compression:set <key> <value>`.

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
