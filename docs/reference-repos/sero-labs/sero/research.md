# sero-labs/sero

## Metadata
- **Stars:** ~2,000
- **License:** AGPL-3.0
- **Last pushed:** 2026-06 (actively maintained)
- **Topics:** agent-os, desktop, electron, pi-framework
- **Fork:** No
- **Author:** Sero Labs (Mario Zechner / badlogic)

## Archetype: agent-workspace-platform

A personal agent operating system (Agent OS) built on the Pi coding agent framework. Electron desktop app that consolidates chat, terminals, file explorer, visual browser, and self-extending plugins into a unified local-first workspace where agents maintain persistent awareness across sessions.

## Structure
- `apps/desktop/` — Electron + React shell (main process + renderer)
- `packages/` — Shared runtime, UI, and common libraries
- `plugins/` — Built-in and example plugins (scout, reviewer, test-writer)
- `eval/` — Promptfoo-based evaluation framework

## Tech Stack
- TypeScript (96%), Electron, React, Module Federation
- Built on Pi coding agent framework (@earendil-works/pi-*)
- Node.js 22, pnpm 10
- Platforms: macOS (Apple Silicon), Linux (x64/arm64), Windows (x64)

## Key Concepts

### Agent-as-Workspace
The fundamental inversion: instead of an agent living in a sidebar/tab, the agent IS the workspace. Files, terminals, browser, and plugins all exist as native context the agent can see and reason about without manual context injection.

### Self-Extending Plugin Paradigm
The agent builds plugins on demand during conversation. User describes a workflow → agent scaffolds plugin (manifest + tools + optional React UI panel) → plugin is live immediately via Module Federation, no restart. Plugins persist across sessions and can be iteratively refined.

### Content vs Details Tool Response Pattern
Tool results separate LLM context from UI rendering:
- `content`: Clean text for the model to reason about
- `details`: Structured data (JSON, images, charts) for the UI to render
Neither pollutes the other. Solves the "parsing text for UI" problem at the source.

### Session Tree (Not Linear Chat)
Conversation history is a tree with fork/clone/branch semantics. Each message has a parentId. Users can explore alternative approaches without losing the original path. Context is linearized root-to-leaf for LLM APIs. Dead-end branches can be compacted independently.

### Composable Hook Interceptors
Extensions intercept the agent loop at surgical points (beforeToolCall, afterToolCall, message_start, turn_end). Enables: plan mode (approve before executing), git checkpointing (auto-commit before mutations), custom compaction triggers, safety filters. Hooks compose — multiple extensions can register for the same event.

### Markdown Specialist Agents
Built-in agents (scout, reviewer, test-writer) are plain markdown files with YAML frontmatter (name, tools, model, permissions) and markdown body (system prompt). Editable, forkable, composable. The agent can create new specialist files during conversation.

### Git-Checkpointed Compaction
Before summarizing old conversation turns, create a git commit. The agent can reconstruct state via `git log` and `git diff` after compaction. Compaction becomes reversible — information moves from conversation context to git history.

### Visual Reasoning Loop
Built-in browser enables closed-loop visual feedback: agent writes code → code renders in browser → agent takes annotated screenshot (elements get numbered labels) → agent reasons about visual layout → agent fixes issues → repeat.

## Extraction Priority: High

### Extractable Patterns

| Pattern | Priority | Notes |
|---------|----------|-------|
| Self-extending plugin paradigm | High | `createPlugin` agentic tool + Module Federation hot reload |
| Content/details tool response | High | Clean separation of LLM context from UI rendering |
| Session tree with fork/clone | High | Non-linear conversation exploration |
| Composable hook interceptors | Medium | Plugin-registered beforeToolCall handlers |
| Visual reasoning loop | Medium | Annotated screenshots + vision-based feedback |
| Git-checkpointed compaction | Medium | Auto-commit before context compression |
| Markdown agent creation | Medium | Agent creates specialist agents mid-conversation |
| Mosaic workspace layout | High | Split-pane desktop (chat + terminal + files + browser) |

### What We Already Have (No Extraction Needed)

| Sero Feature | Our Equivalent |
|---|---|
| Multi-provider LLM | adapters/core — 25+ providers, transport-mux proxy |
| Plugin system | genty/platform/plugins — sandbox, permissions, marketplace |
| Memory/persistence | sdk/profiles + sdk/session — user+project profiles, session state |
| Subagent framework | genty/core/subagent — 3 invocation modes, oversight |
| MCP integration | genty/platform/mcp — full client with channels, permissions |
| Container isolation | Docker, SSH, K8s transports, secure-sandbox |
| Agent definitions | .claude/agents/ + AgentPersona/Soul/Definition CRDs |
| Multi-platform UI | genty/{desktop,web,tui,mobile,tv,watch} — 7+ surfaces |

### What We Have That Sero Doesn't

- Kubernetes-native forge (Kradle) with 89+ CRD types
- Process definitions + babysitter orchestration with breakpoints
- Multi-agent Jitsi meeting integration
- Agent identity system (Persona, Soul, Appearance, Voice profiles)
- Atlas knowledge graph
- 7 platform surfaces (vs Sero's 1)
- CI/CD integration (GitHub Actions workflows)
- Governance layer (authority chains, mandates, posture-based permissions)
- Agent marketplace / process library

## Related Files
- [sero-gap-analysis.md](./sero-gap-analysis.md) — Feature-by-feature gap analysis
- [sero-concepts-and-opportunities.md](./sero-concepts-and-opportunities.md) — Deep architecture concepts and build opportunities
