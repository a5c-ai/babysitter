# Babysitter v6: The Orchestration Platform Goes Universal

**Released: April 18, 2026** | **Version: 5.0.0** | **License: MIT**

---

## TL;DR

- Babysitter is now **open source under MIT**. The version jumps from 0.0.175 to 5.0.0 (internally "v6"), signaling a clean break with the experimental era.
- **43 packages** ship in the monorepo, transforming babysitter from a single SDK into a full-stack orchestration platform spanning CLI, TUI, web, mobile, TV, and watch surfaces.
- **9 harness adapters** (Claude, Codex, Copilot, Cursor, Gemini, Oh-My-Pi, OpenClaw, OpenCode, Pi) let babysitter processes run on any AI coding assistant, not just one.
- A **process library** of 62 methodologies and 40 specialization domains provides executable, community-extensible workflows out of the box.
- The architecture is now **catalog-driven end-to-end**: YAML graph definitions generate TypeScript types, JSON snapshots, adapter configs, and hook registrations with no hand-wired glue.

---

## The Big Picture

When babysitter started, it was a single npm package that could wrap an AI agent session in a structured process. You called `defineTask`, wrote some effects, and the SDK kept your agent on the rails. That was useful, but it only worked with one harness, in one environment, with one person watching.

v6 rewrites that premise. Babysitter is now a **universal orchestration platform**: 43 packages that can schedule, observe, multiplex, and replay agent work across every major AI coding harness, on every screen from a wristwatch to a Kubernetes cluster. The SDK is still at the center, surrounded by a transport layer (Transport Mux), a harness abstraction (Agent Mux), a hook system that works identically across nine adapters (Hooks Mux), a breakpoint service that survives serverless cold starts (Breakpoints Mux), a knowledge graph (Atlas), a real-time dashboard (Observer), and the largest open library of executable development methodologies we know of.

The unifying design principle is the **mux pattern**: every integration surface is defined once in a central catalog and multiplexed to N adapters or targets through generated code. This means adding a new harness adapter, a new deployment target, or a new process specialization is a data change, not a code change. Combined with the move to MIT licensing, v6 is an invitation to the community: bring your harness, bring your methodology, and babysitter will orchestrate it.

---

## What's New

### Agent Mux

The largest new subsystem. Agent Mux consolidates 1,363 files and 205K lines from a formerly standalone repository into the babysitter monorepo, delivering a unified runtime for managing agent sessions across every surface.

It ships over 20 sub-packages: `core`, `adapters`, `cli`, `gateway`, `sdk`, `webui`, `tui`, `observability`, and `harness-mock` among them. The gateway server (71 files, 18K lines) handles auth, cloud bootstrap, and workspace inventory. The TUI (99 files, 12K lines) supports cross-harness session resume and fork -- pause a Claude session and pick it up in Codex without losing state.

- **Native platform apps**: React Native mobile (iOS and Android), TV apps (AndroidTV and AppleTV), watch apps (WatchOS SwiftUI and WearOS Compose).
- **WebUI**: Kanban boards, workspace shells, and session chat, migrated from Radix/Tailwind to the new Compendium design system.
- **Core entry points**: Separate exports for `browser`, `kanban`, and `automation` let consumers tree-shake to exactly the surface they need.
- **amux-proxy**: A standalone CLI binary for proxying agent-mux sessions through transport layers.

### Atlas

Atlas is a knowledge graph system migrated from its own monorepo into babysitter, comprising 2,417 files and 433K lines. It indexes YAML-based catalog graphs and exposes them through a CLI (`atlas` / `a5c-atlas` binaries) and a Next.js WebUI.

The WebUI received a full Compendium redesign with first-class dark mode and tabbed article navigation. Programmatic consumers can import `./indexer` and `./graph-index` entry points directly. An Azure deployment pipeline (`deploy-atlas-webui.yml`) ships alongside the package for production hosting.

- YAML-based catalog graph with schema-validated nodes and edges.
- Full-text indexer with incremental rebuild support.
- Article tabs, dark mode, and Compendium tokens in the WebUI.
- Azure CI/CD pipeline for one-command deployment.

### Hooks Mux

Hooks Mux (248 files, 30K lines) provides a unified hook system with adapters for all 9 supported harnesses. The core package (`@a5c-ai/hooks-mux-core`) defines canonical schemas, types, a session store, and a merge engine that reconciles hook state across concurrent agent invocations.

Three documentation guides are referenced across the adapter READMEs: `adapter-integration-guide.md`, `portable-hook-authoring.md`, and `session-context-propagation.md`.

- **9 adapters**: Claude, Codex, Copilot, Cursor, Gemini, Oh-My-Pi, OpenClaw, OpenCode, Pi.
- Canonical session store with merge engine for concurrent state.
- Docs referenced: `adapter-integration-guide.md`, `portable-hook-authoring.md`, `session-context-propagation.md`.

### Breakpoints Mux

Breakpoints Mux (108 files, 26K lines) replaces the former `breakpoints-pro` package with a serverless-ready breakpoint multiplexing system. Breakpoints are the mechanism by which a babysitter process can pause execution and wait for human input; making them durable across cold starts and provider restarts is critical for production use.

- **Pluggable backends**: GitHub Issues (durable and lossless) and server-based.
- Cryptographic proof signing ("proven" subsystem) for tamper-evident breakpoint responses.
- MCP server, CLI, and browser-based auth flows.
- 7 export entry points: root, `backends`, `proven`, `mcp`, `harness`, `auth`, `config`.

### SDK 5.0.0

The SDK (453 files, 58K lines) remains the foundation of every babysitter process. v6 expands the public API from 9 to 46+ exports while keeping `defineTask` backward-compatible with the existing object-form spec.

The CLI is now split: core commands stay in the `babysitter` binary, while orchestration commands move to `agent-platform`, with `babysitter-harness` retained as a compatibility binary. A new `babysitter-mcp-server` binary provides native MCP integration. Session resolution has been overhauled: PID-scoped session markers now take precedence over environment variables, with `BABYSITTER_TRUST_ENV_SESSION=1` available as an escape hatch for CI environments.

- New dependencies: `@a5c-ai/atlas`, `@a5c-ai/agent-mux`, `@modelcontextprotocol/sdk`, `zod@4`, `ws`.
- `defineTask` remains backward-compatible with object-form specs.
- SDK version markers are now written to run artifacts for auditability.
- PID-scoped session markers replace env-var-first resolution.

```bash
# New CLI surface in v6
npx babysitter run my-process          # core: execute a process
npx agent-platform call my-process   # harness: orchestrate a run with breakpoints
npx agent-platform yolo my-process   # harness: non-interactive orchestration
npx babysitter-mcp-server              # MCP: expose babysitter as an MCP server
```

### Agent Catalog

Agent Catalog (127 files, 26K lines) is the single source of truth for the entire platform. It implements a code-generation pipeline: YAML graph definitions produce TypeScript types, which produce JSON snapshots consumed at runtime.

The evidence system validates freshness of catalog entries, flagging stale adapter details before they reach production. Hook registration paths (`hookRegistrationAliasPaths`) enable cross-harness hook discovery without manual wiring.

- YAML graph to TypeScript types to JSON snapshots (end-to-end code gen).
- Evidence system with freshness validation.
- `hookRegistrationAliasPaths` for cross-harness hook discovery.
- Adapter details derived from catalog graph, not hardcoded.

### Plugin System (Agent Plugins Mux)

The unified plugin mux (71 files, 13K lines) extracts per-harness plugin logic into a single adapter interface. Plugin targets are now catalog-driven rather than hardcoded, and generated bundles are no longer committed to the repository -- they are produced during CI.

A 2,787-line specification document defines the full plugin contract, making third-party plugin development self-service.

- Per-harness logic unified behind a single adapter interface.
- Plugin targets derived from the agent catalog.
- Generated bundles produced by CI (`generate-plugins.yml`), not committed.
- Comprehensive specification document (2,787 lines).

### Observer Dashboard

The Observer Dashboard (229 files, 38K lines) provides real-time observability into babysitter runs. Built on Next.js 16 and React 19, it streams events via SSE and renders large run histories with `@tanstack/react-virtual` for smooth scrolling through thousands of entries.

The UI uses the Compendium design system with Radix UI reserved for specialized interactive components like popovers and dialogs.

```bash
# Launch the observer dashboard
npx babysitter-observer-dashboard
```

- Next.js 16, React 19, SSE streaming.
- Compendium design system with Radix UI for specialized components.
- Virtualized run histories via `@tanstack/react-virtual`.
- Standalone binary: runs with a single npx command.

### Transport Mux

Transport Mux (28 files, 4K lines) is a lightweight transport and proxy runtime built on Hono. It bridges agent-mux sessions to provider backends and handles provider-backed token counting.

- Built on Hono for minimal footprint.
- `amux-proxy` CLI binary for standalone operation.
- Provider-backed token counting.

### Triggers

Triggers (26 files, 1.3K lines) normalize webhook events from GitHub Actions, GitLab CI, and Bitbucket Pipelines into a unified schema that babysitter processes can consume without provider-specific branching.

```yaml
# Use in GitHub Actions via the published action
- uses: a5c-ai/babysitter@v6
  with:
    prompt: "run my-ci-process"
```

- GitHub Actions, GitLab, Bitbucket webhooks unified into a single schema.
- `amux-triggers` CLI binary.
- GitHub Action (`action.yml`) for direct workflow integration.

### Cloud

The Cloud package (28 files, 3.8K lines) provides a deployment SDK with zero runtime dependencies. It targets Kubernetes across all major providers.

- **Supported targets**: Minikube, EKS, AKS, GKE.
- Zero runtime dependencies -- the package is pure orchestration logic.
- Declarative cluster configuration.

### Process Library

The process library is the largest area of v6 by raw volume: 8,077 files totaling 2.19M lines. It ships 62 methodologies and 40 specialization domains, all implemented as executable JavaScript modules rather than static YAML templates.

Methodologies cover the full spectrum of software development approaches: agile, scrum, kanban, shape-up, TDD, BDD, DDD, ODD, spec-kit, and dozens more. Specialization domains span web, mobile, backend, data science and ML, DevOps, security, game development, embedded systems, FPGA, GPU programming, and robotics.

The library also includes community contributions. External contributors have submitted processes like `prd-to-spec` and `task-to-prd`, demonstrating that the process definition format is accessible to authors outside the core team.

- **62 methodologies**: agile, scrum, kanban, shape-up, TDD, BDD, DDD, ODD, spec-kit, and more.
- **40 specialization domains**: web, mobile, backend, data-science-ml, devops, security, game-dev, embedded, fpga, gpu, robotics, and more.
- Processes are executable JS modules with typed effects, not static YAML.
- Community-contributed processes accepted and shipped.

### WebUI and Compendium Design System

Across all web surfaces (430 files, 78K lines), v6 completes a systematic migration to the `@a5c-ai/compendium` design system. This replaces the previous stack of Radix UI wrappers, Tailwind CSS, CVA, and clsx with a cohesive set of primitives.

- New primitives: `cx()`, `AppShell`, `Modal`, `ToastProvider`.
- Design tokens delivered via `app.css`.
- First-class dark mode across all web surfaces.
- Radix UI retained only for specialized interactive components.

### CI/CD

Thirteen workflow files (2.7K lines) implement a tag-driven release model. The two largest are `release.yml` (803 lines) and `staging-publish.yml` (891 lines).

- New workflows: `deploy-atlas-webui.yml`, `publish-packages-from-tag.yml`, `release-tags.yml`, `generate-plugins.yml`, `sync-external-plugins.yml`.
- Tag-driven release model replaces manual publishing.
- Plugin bundles generated in CI, not committed to the repo.

---

## Design Philosophy

Five architectural decisions define v6:

**Catalog-driven architecture.** The Agent Catalog is the single source of truth. Harness adapters, hook registrations, plugin targets, and deployment configs are all derived from YAML graph definitions through code generation. Adding a new harness means adding a YAML node, not writing adapter boilerplate.

**The mux pattern.** Every integration surface -- hooks, agents, breakpoints, transport, plugins, triggers -- follows the same multiplexing pattern: one canonical interface, N adapters generated or configured from the catalog. This keeps the per-adapter maintenance cost near zero.

**Compendium design system.** All web and native UIs share a single design token set and component library. Dark mode, responsive layout, and accessibility are system-level concerns, not per-app afterthoughts.

**MCP-first integration.** The SDK ships a dedicated MCP server binary (`babysitter-mcp-server`). Breakpoints Mux exposes its own MCP server. The platform treats the Model Context Protocol as a first-class integration surface alongside CLI and HTTP.

**Executable process library.** Processes are JavaScript modules that export typed functions, not YAML checklists or Markdown runbooks. They compose, they have typed effects, and they can be tested with the same tooling as application code.

---

## Breaking Changes and Migration

| Change | Migration Path |
|--------|---------------|
| **Version 0.0.175 to 5.0.0** | Update your `package.json` range. `^0.0.x` will not resolve to 5.x. |
| **License: UNLICENSED to MIT** | No action required. Your usage rights are now broader. |
| **CLI split: `babysitter` / `agent-platform`** | Orchestration commands (`call`, `yolo`, `resume`, `plan`, `forever`) now live in `agent-platform`. Update scripts and CI configs. |
| **`BABYSITTER_SESSION_ID` to `AGENT_SESSION_ID`** | Rename the env var in your CI configs. The SDK no longer reads the old name; agent-mux still recognizes it as a detection signal. |
| **PID-scoped session resolution** | Sessions are now resolved via PID-scoped markers by default. Set `BABYSITTER_TRUST_ENV_SESSION=1` to restore env-var-first behavior in CI. |
| **`.a5c/functions/` removed** | Migrate to the current effect and hook APIs. The old function API is gone. |
| **Paperclip VS Code extension removed** | Use Breakpoints Mux or Observer Dashboard for in-IDE observability. |
| **`--plugin-root` flag removed** | Plugin discovery is now automatic. Remove the flag from your CLI invocations. |
| **Public API: 9 to 46+ exports** | No breaking change for existing imports. New exports are additive. |
| **`compaction`, `mcpClient`, `mcpChannels` moved** | Import from `@a5c-ai/agent-platform` instead of the root SDK. |
| **zod@4 required** | Upgrade from zod@3. Schema APIs have minor breaking changes; see the [zod@4 migration guide](https://zod.dev/v4). |

---

## Open Source

Babysitter is now released under the **MIT license**. The repository lives at [github.com/a5c-ai/babysitter](https://github.com/a5c-ai/babysitter).

MIT means you can use babysitter in commercial products, fork it, modify it, and redistribute it with no obligations beyond preserving the copyright notice. We chose MIT because orchestration infrastructure should be a commons: the value is in what you build on top of it, not in the plumbing itself.

All 43 packages, the full process library, and the CI/CD pipelines are included. There are no "enterprise" holdbacks.

---

## By the Numbers

| Metric | Count |
|--------|-------|
| Commits in v6 | 1,699 |
| Files changed | 14,621 |
| Lines inserted | ~1.28 million |
| Packages in monorepo | 43 |
| Methodologies in process library | 62 |
| Specialization domains | 40 |
| Harness adapters | 9 |
| SDK public exports | 46+ |
| Breakpoint export entry points | 7 |
| CI workflow files | 13 |
| Agent Mux sub-packages | 20+ |

---

## What's Next

v6 ships the platform; the next phase is about the ecosystem. We are focused on three areas: growing the process library through community contributions, expanding harness adapter coverage as new AI coding tools emerge, and hardening the cloud deployment story with managed offerings on each major provider. The catalog-driven architecture means most of this growth is data-driven -- new harnesses, new methodologies, and new specializations are YAML commits, not engineering sprints. If you have a development methodology that deserves to be executable, or a harness that deserves an adapter, open a PR. The platform is ready.
