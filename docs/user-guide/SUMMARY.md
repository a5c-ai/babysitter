# Summary

This is the GitBook-style table of contents for the Babysitter User Guide. It is kept in sync with the Docusaurus sidebar in [navigation.md](./navigation.md) and the entry points on the [landing page](./index.md).

---

## Home

* [Welcome](./index.md)

---

## Getting Started

* [Overview](./getting-started/README.md)
* [Installation](./getting-started/installation.md)
* [Quickstart](./getting-started/quickstart.md)
* [First Run](./getting-started/first-run.md)
* [Migration: Prod to v6](./getting-started/migration.md)

---

## Tutorials

* [Tutorials Overview](./tutorials/index.md)
* [Build a REST API (Beginner)](./tutorials/beginner-rest-api.md)
* [Custom Process (Intermediate)](./tutorials/intermediate-custom-process.md)
* [Multi-Phase Workflows (Advanced)](./tutorials/advanced-multi-phase.md)

---

## Ecosystem

* [Ecosystem Overview](./ecosystem/overview.md)
* [babysitter-sdk (core engine)](./ecosystem/babysitter-sdk.md)
* [adapters (the family)](./ecosystem/adapters.md)
* [atlas (catalog & knowledge graph)](./ecosystem/atlas.md)
* [genty (agent runtime)](./ecosystem/genty.md)
* [observer-dashboard](./ecosystem/observer-dashboard.md)
* [kradle (K8s Git forge — MVP)](./ecosystem/kradle.md)
* [kip-sdk (memory substrate — spec only)](./ecosystem/kip-sdk.md)

---

## Architecture

* [Architecture & How It Fits Together](./architecture.md)

---

## Features

* [Features Overview](./features/index.md)
* [Architecture Overview](./features/architecture-overview.md)
* [**Two-Loops Architecture** (the core model)](./features/two-loops-architecture.md)
* [**Adapters** (run on any harness)](./features/adapters.md)
* [**Process Library** (current library snapshot)](./features/process-library.md)
* [Process Definitions](./features/process-definitions.md)
* [**Quality Convergence**](./features/quality-convergence.md)
* [**Best Practices Guide**](./features/best-practices.md)
* [Breakpoints](./features/breakpoints.md)
* [Hooks](./features/hooks.md)
* [Journal System](./features/journal-system.md)
* [Run Resumption](./features/run-resumption.md)
* [Parallel Execution](./features/parallel-execution.md)

---

## Harnesses

* [Install Matrix](./harnesses/install-matrix.md)
* [Claude Code](./harnesses/claude-code.md)
* [Codex](./harnesses/codex.md)

---

## Reference

* [Reference Overview](./reference/index.md)
* [Adapter Types (all 20)](./reference/adapter-types.md)
* [Slash Commands](./reference/slash-commands.md)
* [CLI Reference](./reference/cli-reference.md)
* [Adapters CLI](./reference/adapters-cli.md)
* [Configuration](./reference/configuration.md)
* [Security](./reference/security.md)
* [Error Catalog](./reference/error-catalog.md)
* [Glossary](./reference/glossary.md)
* [FAQ](./reference/faq.md)
* [Troubleshooting](./reference/troubleshooting.md)

---

## Sitemap

```
docs/user-guide/
|
+-- index.md                              # Landing page
+-- SUMMARY.md                            # Table of contents (this file)
+-- navigation.md                         # Docusaurus navigation configuration
+-- architecture.md                       # Vision + Mermaid diagram + runtime flow
|
+-- ecosystem/                            # Monorepo components
|   +-- overview.md                       # Whole monorepo + how to choose
|   +-- babysitter-sdk.md                 # Core event-sourced engine (GA)
|   +-- adapters.md                       # The adapters family (GA)
|   +-- atlas.md                          # Catalog / knowledge graph (GA)
|   +-- genty.md                          # Unified agent runtime (GA)
|   +-- observer-dashboard.md             # Real-time SSE dashboard (GA)
|   +-- kradle.md                         # K8s-native Git forge (MVP)
|   +-- kip-sdk.md                        # Memory substrate (spec only)
|
+-- getting-started/                      # Getting Started Section
|   +-- README.md                         # Overview
|   +-- installation.md                   # Installation guide
|   +-- quickstart.md                     # Quick configuration
|   +-- first-run.md                      # First workflow execution
|   +-- migration.md                      # Prod (0.0.x) to v6 migration guide
|
+-- tutorials/                            # Step-by-Step Tutorials
|   +-- index.md                          # Tutorials overview
|   +-- beginner-rest-api.md              # Build REST API (beginner)
|   +-- intermediate-custom-process.md    # Custom process (intermediate)
|   +-- advanced-multi-phase.md           # Multi-phase workflows (advanced)
|
+-- features/                             # Core Features
|   +-- index.md                          # Features overview
|   +-- architecture-overview.md          # How the v6 subsystems fit together
|   +-- two-loops-architecture.md         # Symbolic + agentic hybrid model
|   +-- adapters.md                        # Run Babysitter on any harness (v6)
|   +-- process-library.md                # SDK-managed built-in library and current counts
|   +-- process-definitions.md            # Workflow templates
|   +-- quality-convergence.md            # Iterative quality improvement
|   +-- best-practices.md                 # Comprehensive best practices guide
|   +-- breakpoints.md                    # Human-in-the-loop approval
|   +-- hooks.md                          # Extensible lifecycle events
|   +-- journal-system.md                 # Event sourcing and audit
|   +-- run-resumption.md                 # Continue interrupted work
|   +-- parallel-execution.md             # Concurrent task execution
|
+-- harnesses/                            # Supported AI coding harnesses
|   +-- install-matrix.md                 # All supported harnesses + install + hook models
|   +-- claude-code.md                    # Claude Code (fully supported)
|   +-- codex.md                          # Codex (fully supported)
|
+-- reference/                            # Technical Reference
    +-- index.md                          # Reference overview
    +-- adapter-types.md                  # All 20 adapter package types enumerated
    +-- slash-commands.md                 # In-session /babysitter:* command surface
    +-- cli-reference.md                  # Command-line interface
    +-- adapters-cli.md                   # Host-side `adapters` CLI reference (v6)
    +-- configuration.md                  # Config options
    +-- security.md                       # Security model and hardening
    +-- error-catalog.md                  # Error codes and solutions
    +-- glossary.md                       # Terminology
    +-- faq.md                            # Frequently asked questions
    +-- troubleshooting.md                # Problem resolution
```

---

## Document Statistics

| Section | Pages | Status |
|---------|-------|--------|
| Getting Started | 5 | Complete |
| Ecosystem | 8 | Complete |
| Architecture | 1 | Complete |
| Tutorials | 4 | Complete |
| Features | 13 | Complete |
| Harnesses | 3 | Complete |
| Reference | 11 | Complete |
| Navigation | 2 | Complete |
| Home | 1 | Complete |
| **Total** | **48** | **Active** |

---

## Quick Reference Links

### By Experience Level

**Beginner**
- [Installation](./getting-started/installation.md)
- [First Run](./getting-started/first-run.md)
- [REST API Tutorial](./tutorials/beginner-rest-api.md)
- [Glossary](./reference/glossary.md)

**Intermediate**
- [Breakpoints](./features/breakpoints.md)
- [Quality Convergence](./features/quality-convergence.md)
- [Custom Process Tutorial](./tutorials/intermediate-custom-process.md)

**Advanced**
- [Process Definitions](./features/process-definitions.md)
- [Journal System](./features/journal-system.md)
- [Multi-Phase Tutorial](./tutorials/advanced-multi-phase.md)

---

### By Task

**Setup and Installation**
- [Installation](./getting-started/installation.md)
- [Quickstart](./getting-started/quickstart.md)
- [Configuration](./reference/configuration.md)

**Daily Use**
- [CLI Reference](./reference/cli-reference.md)
- [Breakpoints](./features/breakpoints.md)
- [Run Resumption](./features/run-resumption.md)

**Problem Solving**
- [Troubleshooting](./reference/troubleshooting.md)
- [Error Catalog](./reference/error-catalog.md)
- [FAQ](./reference/faq.md)

**Learning**
- [REST API Tutorial](./tutorials/beginner-rest-api.md)
- [Custom Process Tutorial](./tutorials/intermediate-custom-process.md)
- [Multi-Phase Tutorial](./tutorials/advanced-multi-phase.md)

---

## Related Resources

- [GitHub Repository](https://github.com/a5c-ai/babysitter)
- [Releases and Changelog](https://github.com/a5c-ai/babysitter/releases)
- [Issue Tracker](https://github.com/a5c-ai/babysitter/issues)
- [Discussions](https://github.com/a5c-ai/babysitter/discussions)

---

*Last updated: 2026-06-23*
