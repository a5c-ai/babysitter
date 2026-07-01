<div align="center">

# Babysitter
> **Enforce obedience on agentic workforces. Manage extremely complex workflows through deterministic, hallucination-free self-orchestration.**

[![npm version](https://img.shields.io/npm/v/@a5c-ai/babysitter.svg)](https://www.npmjs.com/package/@a5c-ai/babysitter)
[![CI](https://img.shields.io/github/actions/workflow/status/a5c-ai/babysitter/ci.yml?branch=staging)](https://github.com/a5c-ai/babysitter/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@a5c-ai/babysitter?label=downloads)](https://www.npmjs.com/package/@a5c-ai/babysitter)
[![Node.js](https://img.shields.io/node/v/@a5c-ai/babysitter)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/issues)
[![GitHub stars](https://img.shields.io/github/stars/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/stargazers)

---

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
- [Agent Runtime CLI](#agent-runtime-cli)
- [How It Works](#how-it-works)
- [Why Babysitter?](#why-babysitter)
- [Blueprints](#blueprints)
- [Compression](#compression)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Community and Support](#community-and-support)
- [License](#license)

---

## What is Babysitter?

Babysitter enforces obedience to agentic workforces, enabling them to manage extremely complex tasks and workflows through deterministic, hallucination-free self-orchestration. Define your workflow in code - Babysitter enforces every step, ensures quality gates pass before progression, requires human approval at breakpoints, and records every decision in an immutable journal. Your agents do exactly what the process permits, nothing more.

As of v6, Babysitter is harness-agnostic via its **Adapters** runtime: the same processes run across the 12 supported AI coding harnesses, so you are not locked to a single tool. See [Adapters](docs/user-guide/features/adapters.md) and the [harness install matrix](docs/user-guide/harnesses/install-matrix.md).

---

## Prerequisites

- **Node.js**: Version 20.0.0+ (22.x LTS recommended). The host-side `adapters` CLI pins a slightly higher floor of 20.9.0+.
- **A supported AI coding harness**: any of the 12 harnesses covered in the [install matrix](docs/user-guide/harnesses/install-matrix.md) (e.g. Claude Code — [docs](https://code.claude.com/docs/en/quickstart)).
- **Git**: For cloning (optional)

---

## Installation

Babysitter v6 has two install tracks that should not be conflated: the **host-side `adapters` CLI** for running any harness directly from your shell, and the **in-session per-harness plugin** for driving full orchestration runs from inside your harness. Most people want both. The package split is:

- `@a5c-ai/babysitter` is the recommended end-user install for the main `babysitter` CLI.
- `@a5c-ai/adapters-cli` provides the host-side `adapters` CLI (Node >=20.9.0) for running and managing any supported harness from your shell. See the [Adapters CLI reference](docs/user-guide/reference/adapters-cli.md).
- `@a5c-ai/babysitter-sdk` is the public SDK/library package and the underlying implementation behind the core CLI.
- `@a5c-ai/genty-platform` is the optional runtime CLI for `genty call`, `resume`, `start-server`, `tui`, and other orchestration/runtime commands.
- Harness plugins such as `@a5c-ai/babysitter-codex` or `@a5c-ai/babysitter-cursor` integrate Babysitter into a specific host tool. They do not replace the core CLI packages.

For most users, install the main CLI first:

```bash
npm install -g @a5c-ai/babysitter
```

Prefer to drive a harness directly from your shell instead of from inside a session? Install the host-side `adapters` CLI and run any supported harness with one command — see the [Adapters CLI reference](docs/user-guide/reference/adapters-cli.md):

```bash
npm install -g @a5c-ai/adapters-cli
adapters doctor
adapters run claude "explain this codebase"
```

Babysitter supports the 12 AI coding harnesses listed in the [install matrix](docs/user-guide/harnesses/install-matrix.md). Install the plugin for your harness of choice; the two fully-worked harnesses have dedicated pages — [Claude Code](docs/user-guide/harnesses/claude-code.md) and [Codex](docs/user-guide/harnesses/codex.md).
In this repository, [`plugins/babysitter-unified`](plugins/babysitter-unified/plugin.json) is the only maintained plugin source; harness-specific bundles are generated during build/release and are not committed:

### Claude Code

Native marketplace install:

```bash
claude plugin marketplace add a5c-ai/babysitter-claude
claude plugin install --scope user babysitter@a5c.ai
```

Restart Claude Code, then type `/skills` to verify "babysit" appears.

Claude Cowork can install the same plugin. For a personal install from this
repo's Claude marketplace:

1. Open Claude Desktop and switch to the `Cowork` tab.
2. Click `Customize` in the left sidebar.
3. Click `Browse plugins`.
4. Select `Personal`.
5. Click `+`, then choose `Add marketplace from GitHub`.
6. Enter `https://github.com/a5c-ai/babysitter`.
7. Install the `Babysitter` plugin from that marketplace.

For Team and Enterprise org-managed installs, owners can add plugins through
`Organization settings > Plugins`. GitHub-synced organization marketplaces
require a private or internal GitHub repository, so use a private/internal fork
of this repo for that flow, or upload plugin ZIPs manually.

[Plugin README](plugins/babysitter-unified/per-harness/claude-code/README.md)

### Codex CLI (Beta)

Official marketplace install:

```bash
codex plugin marketplace add a5c-ai/babysitter
```

[Plugin README](plugins/babysitter-unified/per-harness/codex/README.md)

### Cursor IDE and CLI (Experimental)

Via the Cursor marketplace or the SDK helper:

```bash
babysitter harness:install-plugin cursor
```

[Plugin README](plugins/babysitter-unified/per-harness/cursor/README.md)

### Gemini CLI (Experimental)

```bash
babysitter harness:install-plugin gemini-cli
```

[Plugin README](plugins/babysitter-unified/per-harness/gemini/README.md)

### GitHub Copilot (Experimental)

Via the GitHub Copilot CLI marketplace, or:

```bash
babysitter harness:install-plugin github-copilot
```

[Plugin README](plugins/babysitter-unified/per-harness/github/README.md)

### Pi (Experimental)

```bash
babysitter harness:install-plugin pi
```

[Plugin README](plugins/babysitter-unified/per-harness/pi/README.md)

### Hermes (Experimental)

```bash
babysitter harness:install-plugin hermes
```

[Plugin README](plugins/babysitter-unified/per-harness/hermes/README.md)

### Oh-My-Pi (Experimental)

```bash
babysitter harness:install-plugin oh-my-pi
```

[Plugin README](plugins/babysitter-unified/per-harness/omp/README.md)

### OpenCode (Experimental)

```bash
babysitter harness:install-plugin opencode
```

[Plugin README](plugins/babysitter-unified/per-harness/opencode/README.md)

### OpenClaw (Experimental)

```bash
babysitter harness:install-plugin openclaw
```

[Plugin README](plugins/babysitter-unified/per-harness/openclaw/README.md)

### Internal Harness (No AI Coding Agent Required)

Babysitter ships with a built-in **internal harness** that runs processes programmatically without any external AI coding agent. This is useful for CI/CD pipelines, scripts, automated testing, and headless orchestration:

```bash
npm install -g @a5c-ai/genty-platform

# Run a process definition using the internal harness
genty call --harness internal --process .a5c/processes/my-process.js#process --workspace .

# Or run a free-form prompt
genty call --harness internal --prompt "run lint and tests" --workspace .
```

The internal harness uses the SDK's built-in Pi execution engine directly. It supports all capabilities (Programmatic, SessionBinding, StopHook, HeadlessPrompt) and requires no external AI harness CLI.

During process execution, the internal harness can **delegate tasks to any discovered installed harness** via the invoker. A process running under `--harness internal` can spawn subagent tasks that execute through Claude Code, Codex, Gemini CLI, or any other harness found on the system -- the SDK discovers available harness CLIs at runtime and routes task execution accordingly. This means you can orchestrate a multi-agent workflow from a single headless entry point, with different tasks delegated to whichever harness is best suited for them.

---

## Runtime Package Builds

For the core runtime chain (`@a5c-ai/babysitter-sdk`, `@a5c-ai/adapters`, `@a5c-ai/genty-core`, `@a5c-ai/genty-platform`), use the shared workspace entrypoint from a fresh checkout:

```bash
npm ci
npm run build:runtime
```

`build:runtime` is the supported root entrypoint for release and CI validation. It builds the runtime graph in workspace order: SDK -> adapters SDK surface -> genty-core -> genty-platform.

Package-local validation is also supported:

```bash
npm run build --workspace=@a5c-ai/genty-core
npm run build --workspace=@a5c-ai/genty-platform
```

Those package-local builds now use `tsc --build` project references where the runtime packages are owned in this workspace, and they explicitly bootstrap the `@a5c-ai/adapters` SDK chain through the root runtime scripts. Fresh-checkout validation no longer assumes prebuilt upstream `dist/` artifacts.

`@a5c-ai/atlas` provides the unified knowledge graph, ontology, and catalog data consumed by SDK, adapters, hooks, plugin tooling, and the catalog UI. The agent catalog surface is `@a5c-ai/atlas/catalog`. See [`packages/atlas/README.md`](packages/atlas/README.md).

### CLI Walkthrough Verification

The published CLI walkthrough at `docs/cli-examples.md` is verified against the real repo surfaces, not a separate docs-only harness. From a fresh checkout, use:

```bash
npm ci
npm run build --workspace=@a5c-ai/babysitter-sdk
npm run docs:prepare
npm run docs:examples:smoke
npm run docs:qa
```

`npm run docs:examples:verify` runs that docs-focused flow end-to-end. The generated traceability map for the walkthrough lives at `docs/generated/cli-examples-verification.md`.

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

## Agent Runtime CLI

Beyond the in-session skill commands (`/babysitter:call`, etc.), Babysitter provides an optional agent runtime CLI package, `@a5c-ai/genty-platform`, for orchestration, session management, MCP serving, daemon utilities, and the TUI. The main `babysitter` CLI comes from `@a5c-ai/babysitter` and is backed by `@a5c-ai/babysitter-sdk`; it keeps the core run/task/session/plugin surfaces plus `harness:install` and `harness:install-plugin`.

```bash
npm install -g @a5c-ai/babysitter
npm install -g @a5c-ai/genty-platform
```

### Running Processes via a Harness

```bash
# Run a process interactively via Claude Code (pauses at breakpoints)
genty call --harness claude-code --prompt "implement user authentication with TDD" --workspace .

# Run fully autonomous (no breakpoints)
genty yolo --harness claude-code --prompt "add pagination to the API" --workspace .

# Plan only (stops after Phase 1)
genty plan --harness claude-code --prompt "implement feature X"

# Run with the internal harness (no external AI agent needed)
genty call --harness internal --prompt "run lint and tests" --workspace .
```

### Managing Runs

```bash
# Resume an interrupted run
genty resume --run-id <runId> --harness claude-code --workspace .

# Initialize or inspect orchestration session state
babysitter session:init --session-id demo --state-dir .a5c --run-id <runId>
babysitter session:state --session-id demo --state-dir .a5c

# Start the MCP server owned by the agent runtime CLI
genty start-server --transport stdio

# Diagnose run health
genty doctor --run-id <runId>

# Analyze past runs for insights
genty retrospect --all --harness claude-code --workspace .

# Clean up old runs
genty cleanup --keep-days 7 --harness claude-code --workspace .
```

### Harness Discovery

```bash
# Install an agent harness CLI (preferred)
adapters install claude-code

# Install a Babysitter harness plugin globally
babysitter harness:install-plugin claude-code

# Install a Babysitter harness plugin into a workspace
babysitter harness:install-plugin codex --workspace /path/to/repo
```

> **Note:** `babysitter harness:install` and `babysitter harness:discover` are deprecated. Use `adapters install <agent>` for agent installation and `genty` for runtime commands.

`harness:install-plugin` is the canonical scriptable install path for Babysitter plugins. For non-Claude harnesses it resolves to the published package installer shape tested in the SDK, for example `npx --yes @a5c-ai/babysitter-codex install --workspace /path/to/repo`.

### Using `--harness internal` for Automation

The `internal` harness is particularly useful for CI/CD and scripting because it requires no external AI coding agent:

```bash
# In a CI pipeline or script
genty call \
  --harness internal \
  --process .a5c/processes/lint-and-test.js#process \
  --workspace . \
  --no-interactive \
  --json
```

It executes processes using the SDK's built-in engine, supports all effect types (tasks, breakpoints, sleeps, parallel dispatch), and produces the same event-sourced journal as any other harness.

### Package Boundaries

| Package | Installs | Use it for |
|---------|----------|------------|
| `@a5c-ai/babysitter` | `babysitter` | Recommended human-facing install for the main CLI |
| `@a5c-ai/babysitter-sdk` | `babysitter`, `babysitter-sdk`, `babysitter-mcp-server` | SDK/library usage and direct access to the core CLI implementation |
| `@a5c-ai/genty-platform` | `genty` | Optional runtime/orchestration commands (`call`, `resume`, `plan`, `start-server`, `tui`, `doctor`) |
| `@a5c-ai/babysitter-<harness>` | Harness-specific installer or plugin binary | Integrating Babysitter into a specific host tool such as Codex, Cursor, Gemini CLI, Pi, or GitHub Copilot |

The repository root `package.json` is workspace metadata for this monorepo. The public packages users install are the scoped packages above.

### Monorepo Structure

```
packages/
  genty/                   # genty agent stack
    cli/                  #   @a5c-ai/genty — CLI binary "genty"
    core/                 #   @a5c-ai/genty-core — agent-core runtime
    platform/             #   @a5c-ai/genty-platform — orchestration platform
    runtime/              #   @a5c-ai/genty-runtime — agent runtime
    ui/ webui/ tui/       #   UI surfaces (web console, terminal UI)
  adapters/               # Adapter family
    sdk/                  #   @a5c-ai/adapters — root SDK + CLI "adapters"
    codecs/               #   @a5c-ai/adapters-codecs — harness codec impls
    cli/                  #   @a5c-ai/adapters-cli
    gateway/              #   @a5c-ai/adapters-gateway
    hooks/                #   hooks-adapter-* (per-harness hook adapters)
    core/ transport/ ...  #   comm-adapter, transport-adapter, etc.
  atlas/                  # @a5c-ai/atlas — knowledge graph + catalog
  sdk/                    # @a5c-ai/babysitter-sdk — core SDK
  kradle/                 # @a5c-ai/kradle — Kubernetes-native forge
    core/ sdk/ cli/ web/
plugins/                  # Installable plugin packages
  babysitter-unified/     #   Unified plugin for all harnesses
blueprints/               # Blueprint marketplace registry
  a5c/marketplace/
library/                  # Process library (methodologies + specializations)
```

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
- **Event-Sourced Journal:** All run state in `~/.a5c/runs/` by default, with repo-local `.a5c/runs/` compatibility reads - deterministic replay and resume from any point

---

## Why Babysitter?

| Traditional Approach | Babysitter |
|---------------------|------------|
| Agent decides what to do and when it's "done" | Orchestrator can only do what your process code permits |
| Ad-hoc workflow | Deterministic, code-defined processes — mandatory stop after every step (enforcement, not assistance) |
| Single task execution | Complex agentic workflows: parallel execution, dependencies, sub-agent delegation across harnesses |
| State lost on session end | Event-sourced, deterministic replay, fully resumable |
| Manual approval via chat | Structured breakpoints with context |
| No audit trail | Complete journal of all events |
| Run script once, hope it works | Gates (including quality gates) block progression until satisfied |

**Key differentiators:** Process enforcement, deterministic replay, human-in-the-loop breakpoints, parallel execution, and quality convergence (one gate type among several).

---


## Blueprints

Babysitter has its own blueprint system -- and it works differently from what you might expect. A blueprint is not a code module with extension points. It's a **set of natural language instructions** (markdown files) or **deterministic coded processes** (JS files) that an AI agent reads and executes. The SDK stores, versions, and distributes the instructions. The AI agent is the runtime.

This means a blueprint can do anything an AI agent can do: install npm packages, generate CI/CD pipelines, set up git hooks, create Terraform configs, modify your linter rules, copy babysitter processes into your project, and interview you about your preferences along the way.

The official marketplace includes blueprints for **security** (gitleaks, ESLint security rules, audit processes), **testing** (Vitest/Playwright/pytest setup, coverage gates, TDD processes), **deployment** (Terraform, Helm, Dockerfiles, multi-environment pipelines), **themes** (sound effects, design systems, conversational personality), **CI/CD** (GitHub Actions workflows), and **rate limiting** (exponential backoff hooks).

To manage blueprints, use the `/babysitter:blueprints` command inside your harness (or `babysitter blueprints:*` from the CLI). The agent reads the blueprint's install instructions, interviews you, analyzes your project, and executes the setup -- all within a babysitter orchestration run.

See the full [Blueprints documentation](docs/blueprints.md) for details on how installs work, the marketplace format, creating your own blueprints, and the migration system. Agent harness plugins are covered separately in [Plugins documentation](docs/plugins.md).

---

## Compression

Babysitter includes a 4-layer token compression subsystem (built into `packages/babysitter-sdk/`) that reduces context window usage by 50-67% on real sessions while maintaining 99% fact retention.

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

<!-- docs-surface-map:start -->
### Package and Plugin Surface Map
- [Package and Plugin Docs Map](docs/package-and-plugin-map.md) - canonical public/internal status, docs entrypoints, and coverage notes for active packages and plugins
<!-- docs-surface-map:end -->

### Getting Started
- [Quickstart Guide](docs/user-guide/getting-started/quickstart.md)
- [Beginner Tutorial: REST API](docs/user-guide/tutorials/beginner-rest-api.md)
- [Best Practices](docs/user-guide/features/best-practices.md)
- [Migration Guide (0.0.x → v6)](docs/user-guide/getting-started/migration.md)

### Features
- [Adapters](docs/user-guide/features/adapters.md) - Harness-agnostic runtime across the 12 supported harnesses
- [Harness Install Matrix](docs/user-guide/harnesses/install-matrix.md) - Per-harness install instructions and invocation tokens
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
- [CLI Reference](docs/user-guide/reference/cli-reference.md) - The core `babysitter` CLI
- [Adapters CLI Reference](docs/user-guide/reference/adapters-cli.md) - The host-side `adapters` CLI
- [Atlas Knowledge Graph](packages/atlas/README.md)

---

## Contributing

We welcome contributions! Here's how you can help:

- **Report bugs**: [GitHub Issues](https://github.com/a5c-ai/babysitter/issues)
- **Suggest features**: Share your ideas for improvements
- **Submit pull requests**: Fix bugs or add features
- **Improve documentation**: Help make docs clearer
- **Check workspace coverage**: [docs/workspace-validation.md](docs/workspace-validation.md)

See [CONTRIBUTING.md](https://github.com/a5c-ai/babysitter/blob/main/CONTRIBUTING.md) for detailed guidelines.

---

## Community and Support

- **Discord**: [Join our community](https://discord.gg/dHGkzxf48a) *(GitHub invite link)*
- **GitHub Issues**: [Report bugs or request features](https://github.com/a5c-ai/babysitter/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/a5c-ai/babysitter/discussions)
- **npm**: [@a5c-ai/babysitter](https://www.npmjs.com/package/@a5c-ai/babysitter)

### Community Tools

| Tool | Description |
|------|-------------|
| [Observer Dashboard](https://github.com/a5c-ai/babysitter) | Real-time monitoring UI for parallel runs — install and launch with the built-in `/babysitter:observe` command |
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
