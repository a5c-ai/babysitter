<div align="center">

# Babysitter

[![npm version](https://img.shields.io/npm/v/@a5c-ai/babysitter-sdk.svg)](https://www.npmjs.com/package/@a5c-ai/babysitter-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/issues)
[![GitHub stars](https://img.shields.io/github/stars/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/stargazers)

> **Orchestrate complex, multi-step workflows with human-in-the-loop approval, iterative refinement, and quality convergence.**

[Getting Started](#installation) | [Documentation](#documentation) | [Community](#community-and-support)

</div>

---

https://github.com/user-attachments/assets/8c3b0078-9396-48e8-aa43-5f40da30c20b

---

## Table of Contents

- [What is Babysitter?](#what-is-babysitter)
- [What is a5c.ai?](#what-is-a5cai)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Why Babysitter?](#why-babysitter)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Community and Support](#community-and-support)
- [License](#license)

---

## What is Babysitter?

Babysitter is an orchestration framework for Claude Code that enables deterministic, event-sourced workflow management. It allows you to build complex, multi-step development processes with built-in quality gates, human approval checkpoints, and automatic iteration until quality targets are met. Babysitter works seamlessly with your existing subagents, skills, and tools, orchestrating them into sophisticated workflows.

## What is a5c.ai?

**a5c.ai** (agentic ai) is an organization building advanced AI orchestration and automation tools for complex software development tasks.

---

## Prerequisites

- **Node.js**: Version 20.0.0+ (22.x LTS recommended)
- **Claude Code**: Latest version ([docs](https://code.claude.com/docs/en/quickstart))
- **Git**: For cloning (optional)

---

## Installation

### 1. Install the SDK

```bash
npm install -g @a5c-ai/babysitter@latest @a5c-ai/babysitter-sdk@latest @a5c-ai/babysitter-breakpoints@latest
```

### 2. Install the Plugin

```bash
claude plugin marketplace add a5c-ai/babysitter
claude plugin install --scope user babysitter@a5c.ai
claude plugin enable --scope user babysitter@a5c.ai
```

Then restart Claude Code.

### 3. Verify Installation

Type `/skills` in Claude Code to verify "babysit" appears.

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

---

## How It Works

```
+-----------------------------------------------------------------+
|                     Babysitter Loop                              |
|                                                                  |
|   +----------+     +----------+     +----------+     +----------+|
|   | Iterate  | --> |   Get    | --> | Execute  | --> |   Post   ||
|   |          |     | Effects  |     |  Tasks   |     | Results  ||
|   +----------+     +----------+     +----------+     +----------+|
|        |                                               |         |
|        +----------------- repeat <---------------------+         |
+-----------------------------------------------------------------+
```

**Each iteration:** Advance process -> Get pending effects -> Execute tasks -> Record outcomes -> Repeat until complete.

**Everything is recorded:** `.a5c/runs/<runId>/` contains journal, tasks, and state. Pause, resume, or recover at any point.

---

## Why Babysitter?

| Traditional Approach | Babysitter |
|---------------------|------------|
| Run script once, hope it works | Iterate until quality target met |
| Manual approval via chat | Structured breakpoints with context |
| State lost on session end | Event-sourced, fully resumable |
| Single task execution | Parallel execution, dependencies |
| No audit trail | Complete journal of all events |
| Fixed workflow | Process-driven, customizable |

**Key differentiators:** Deterministic replay, quality convergence, human-in-the-loop breakpoints, agent scoring, and parallel execution.

---

## Documentation

### Getting Started
- [Quickstart Guide](docs/user-guide/getting-started/quickstart.md)
- [Beginner Tutorial: REST API](docs/user-guide/tutorials/beginner-rest-api.md)

### Features
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

- **GitHub Issues**: [Report bugs or request features](https://github.com/a5c-ai/babysitter/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/a5c-ai/babysitter/discussions)
- **npm**: [@a5c-ai/babysitter-sdk](https://www.npmjs.com/package/@a5c-ai/babysitter-sdk)

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
