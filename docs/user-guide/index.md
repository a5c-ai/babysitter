---
title: Babysitter User Guide
description: Comprehensive documentation for Babysitter - the AI-powered development workflow orchestrator with quality convergence and human-in-the-loop approval
category: landing
last_updated: 2026-01-26
---

# Babysitter User Guide

Welcome to the Babysitter documentation. Babysitter is an AI-powered development workflow orchestrator that enables iterative quality convergence with human-in-the-loop approval through breakpoints.

---

## Quick Start

Get up and running with Babysitter in minutes.

| Step | Description | Time |
|------|-------------|------|
| [Installation](./getting-started/installation.md) | Install the Babysitter plugin | 5 min |
| [Quickstart](./getting-started/quickstart.md) | Configure your environment | 5 min |
| [First Run](./getting-started/first-run.md) | Execute your first babysitter workflow | 10 min |

---
## What is Babysitter? (Start Here if You're New)

**Babysitter automates the "try, check, fix, repeat" cycle of development** so you don't have to do it manually.

### The Problem Babysitter Solves

When you ask an AI to write code, you typically:
1. Get code from the AI
2. Run tests → tests fail
3. Send errors back to AI
4. Get fixed code
5. Run tests again → still failing
6. Repeat 5-10 times...

**Babysitter automates this entire loop**, running it until your quality targets are met.

### How It Works (In Plain English)

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU: "Build a login page with tests"                           │
│                         ↓                                       │
│  BABYSITTER: Runs this loop automatically:                      │
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
- How the iteration loop works
- What a quality gate looks like
- How to approve at breakpoints

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

| Feature | Description |
|---------|-------------|
| [**Process Library**](./features/process-library.md) | **2,000+ pre-built processes** across 30+ categories - web, AI, DevOps, science, business, and more |
| [**Two-Loops Architecture**](./features/two-loops-architecture.md) | **Hybrid agentic systems** - symbolic orchestration + agentic harness, guardrails, and evidence-driven completion |
| [**Quality Convergence**](./features/quality-convergence.md) | **Five quality gate types** (tests, code quality, static analysis, security, performance) with 90-score patterns |
| [**Best Practices**](./features/best-practices.md) | **Four guardrail layers**, multi-gate validation, workflow design, and team collaboration patterns |
| [Breakpoints](./features/breakpoints.md) | Human-in-the-loop approval system for critical decisions |
| [Process Definitions](./features/process-definitions.md) | Customizable workflow templates and task orchestration |
| [Journal System](./features/journal-system.md) | Event-sourced audit trail and state reconstruction |
| [Run Resumption](./features/run-resumption.md) | Continue interrupted workflows from any point |
| [Parallel Execution](./features/parallel-execution.md) | Concurrent task execution for faster results |
| [VSCode Extension](./features/vscode-extension.md) | Monitor, dispatch, and interact with runs from VSCode |
| [Telegram Integration](./features/telegram-integration.md) | Mobile notifications and breakpoint approvals via Telegram |

> **Highlight:** The Process Library contains ready-to-use orchestration for virtually any development task - from React components to machine learning pipelines to business process modeling. [Explore the library →](./features/process-library.md)

> **Essential Reading:** Understanding the [Two-Loops Architecture](./features/two-loops-architecture.md) is key to designing reliable, bounded agentic workflows with proper guardrails and evidence-driven completion.

---

### Reference

Technical specifications and lookup resources.

| Reference | Description |
|-----------|-------------|
| [CLI Reference](./reference/cli-reference.md) | Complete command-line interface documentation |
| [Configuration](./reference/configuration.md) | Environment variables and config file options |
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

### Version 0.0.123 (2026-01-25)

- Added numerous new skills and agents across various engineering domains
- Enhanced babysitter capabilities in chemical, civil, electrical, and environmental engineering
- New scientific discovery processes

### Recent Updates

| Version | Date | Highlights |
|---------|------|------------|
| 0.0.123 | 2026-01-25 | Engineering domain skills expansion |
| 0.0.122 | 2026-01-24 | Bug fixes and stability improvements |
| 0.0.121 | 2026-01-23 | Performance optimizations |

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

*Last updated: 2026-01-25*
