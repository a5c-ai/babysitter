# Sero Agent OS — Gap Analysis vs Babysitter Stack

## What Sero Is

Sero is a **personal agent operating system** (Agent OS) — an Electron desktop app built on the Pi coding agent framework. It consolidates chat, terminals, file explorer, visual browser, and plugins into a unified local-first workspace where agents maintain persistent awareness across sessions.

## Feature Mapping

| Sero Feature | Our Status | Our Implementation | Gap |
|---|---|---|---|
| **Unified Desktop Workspace** | PRESENT | genty/desktop-app (Electron), genty/web-app (Vite), genty/tui (Ink), mobile/TV/watch apps | None — we have MORE platforms |
| **Visual Browser / Screenshots** | PARTIAL | genty/core agenticTools/browser (Puppeteer-based screenshots) | Missing: screen recording, video clips, Playwright integration |
| **Project Memory & Persistence** | PRESENT | sdk/profiles (user+project), sdk/session (state+transcript), platform/daemon (cron scheduler) | None — we have equivalent or richer persistence |
| **Self-Extending Plugin System** | PRESENT | platform/plugins (sandbox, loader, permissions), platform/skills (router, discovery, chaining) | None — our plugin system is more advanced (permissions, sandboxing, marketplace) |
| **Runtime Isolation** | PRESENT | Docker, SSH, K8s transports, secure-sandbox, governance layer | None — we have MORE isolation modes |
| **Built-in Specialists / Subagents** | PRESENT | genty/core/subagent (3 invocation modes), .claude/agents/ (markdown specs), AgentPersona CRDs | None — our subagent system is richer |
| **Multi-Provider LLM** | PRESENT | 25+ providers via adapters/core, transport-adapter, provider translation tables | None — we support far more providers |
| **Agent Orchestration** | PRESENT | babysitter-sdk (orchestrate, iterate, effects, journal), genty/core/loop, genty/platform/harness | None — our orchestration is more sophisticated (process definitions, effects, breakpoints) |
| **MCP Integration** | PRESENT | genty/platform/mcp (client, channels, transport, executor, tool registry) | None — full MCP support |
| **Evaluation Framework** | PARTIAL | Vitest tests, E2E pipeline tests, contract tests, live-stack tests | Missing: Promptfoo-style evaluation DSL, LLM benchmark harness, continuous quality scoring |
| **Module Federation** | MISSING | — | No dynamic module federation for live plugin loading in desktop/web app |
| **Screen Recording** | MISSING | — | No video/clip recording capability |

## What We're Missing (Gaps)

### Gap 1: Screen Recording for Agents
**Sero**: Agents can record short video clips of running applications.
**Us**: Only Puppeteer screenshots. No video recording.
**Fix**: Add screen recording to the browser agentic tool — use Puppeteer's `page.screencast()` API or integrate `ffmpeg` for recording.
**Effort**: Small — Puppeteer already supports screencast.

### Gap 2: Promptfoo-Style Evaluation Framework
**Sero**: Includes promptfoo-based evaluation framework in `eval/` directory.
**Us**: Solid test infrastructure (vitest, contract tests, live-stack E2E) but no evaluation-as-a-service framework for scoring agent responses, comparing prompts, or continuous quality benchmarking.
**Fix**: Add an `eval/` package with promptfoo integration. Define evaluation suites for:
- Agent response quality scoring
- Prompt comparison (A/B testing)
- Regression detection across model versions
- Task completion benchmarks
**Effort**: Medium — framework setup + evaluation suite authoring.

### Gap 3: Module Federation for Live Plugin Loading
**Sero**: Uses Webpack Module Federation to dynamically load plugins at runtime without app restart.
**Us**: Plugin loader exists but uses traditional dynamic import, not Module Federation. Desktop and web apps would need to restart or rebuild to pick up new plugins.
**Fix**: Add Module Federation to genty/desktop-app and genty/web-app Vite configs. Use `@module-federation/vite` to expose/consume plugin containers dynamically.
**Effort**: Medium — Vite Module Federation plugin is available but requires plugin architecture adaptation.

### Gap 4: Unified Desktop Experience Polish
**Sero**: Polished single-pane Electron app with integrated chat + terminal + file explorer + browser in one window.
**Us**: Desktop app exists but is a scaffold with page-based routing (Home, Sessions, Agents, Kanban). Not yet a unified workspace with simultaneous chat + terminal + file explorer panes.
**Fix**: Redesign genty/desktop-app layout to support split-pane views:
- Left: File explorer + project tree
- Center: Chat / session conversation
- Right: Terminal / tool output
- Bottom: Activity feed / notifications
Use a layout manager (like `react-mosaic` or `allotment`) for resizable panes.
**Effort**: Large — significant UI architecture work.

## What We Have That Sero Doesn't

| Our Feature | Sero Equivalent |
|---|---|
| **Kubernetes-native forge (Kradle)** | Nothing — Sero has no K8s/CRD/infrastructure management |
| **89+ CRD resource types** | Nothing — Sero operates purely locally |
| **Process definitions + babysitter orchestration** | Nothing — Sero uses Pi's simpler agent loop |
| **Multi-agent meeting (Jitsi integration)** | Nothing — no video conferencing or multi-agent meetings |
| **Agent identity system (Persona, Soul, Appearance, Voice)** | Basic specialist agents — no rich identity model |
| **Atlas knowledge graph** | Nothing — no structured knowledge graph |
| **7 platform surfaces (desktop, web, TUI, mobile×2, TV×2, watch×2)** | Only desktop (Electron) |
| **Breakpoints + approval gates** | Nothing — no human-in-the-loop orchestration gates |
| **Agent marketplace / process library** | Plugin system but no marketplace |
| **CI/CD integration (GitHub Actions, workflows)** | Nothing — local-only |
| **Governance layer (authority chains, mandates)** | Basic plugin permissions only |
| **Transport-adapter (multi-provider proxy routing)** | Basic provider support |
| **Hooks-adapter (cross-harness hook normalization)** | Plugin hooks only |

## Priority Fixes

| Priority | Gap | Effort | Impact |
|---|---|---|---|
| P1 | Unified desktop workspace (split-pane layout) | Large | High — this is Sero's core UX differentiator |
| P2 | Evaluation framework (promptfoo) | Medium | High — quality assurance for agent responses |
| P3 | Screen recording | Small | Medium — agents can provide richer visual feedback |
| P4 | Module Federation for live plugins | Medium | Medium — smoother plugin development experience |
