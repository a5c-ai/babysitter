# Hermes Agent Deep Research

## Executive Summary

Hermes Agent is a Python-based (83.6% Python, 12.6% TypeScript) MIT-licensed autonomous AI agent by Nous Research. Its architecture centers on a monolithic `AIAgent` class (~4,400 lines in `run_agent.py`) that powers all surfaces: CLI, messaging gateway (20+ platforms), ACP (IDE integration), batch, and API server. It supports 30+ LLM providers, 70+ tools across 28 toolsets, pluggable memory providers, a self-evolution companion system (DSPy + GEPA), and a community Skills Hub at agentskills.io.

Our stack differs fundamentally in philosophy: we are a multi-harness orchestration platform that wraps multiple agent products (Claude Code, Codex, Gemini CLI, Hermes, and others) through a unified adapter architecture. Hermes is one agent we integrate via `adapter-hermes`. The key architectural tension is between Hermes' breadth-of-platform-reach (20+ messaging adapters, 30+ providers, 70+ tools) and our depth-of-orchestration (durable runs, journals, effects, breakpoints, multi-harness coordination).

## Architecture Comparison

| Aspect | Hermes | Our Stack |
|--------|--------|-----------|
| **Core loop** | Single `AIAgent` class, synchronous | Upstream harness owns loop; we wrap via adapter bridge |
| **Language** | Python 83.6% | TypeScript 100% |
| **Provider count** | 30+ with fallback chains | Provider-agnostic; delegates to harness |
| **Tool count** | 70+ across 28 toolsets | Focused agentic tools + harness-native tools |
| **Platform adapters** | 20+ messaging platforms | Multi-harness adapters (10+ agent products) |
| **Plugin scope** | Hermes-internal only | Cross-harness portable plugins |
| **Memory** | Pluggable providers with 12 lifecycle hooks | crossRunState + atlas graph |
| **Session storage** | SQLite with FTS5 | Event-sourced journals |
| **Orchestration** | Subagent delegation + cron | Durable runs, effects, breakpoints, multi-agent |
| **Governance** | Approval callbacks + allowlists | Structured engine with decision trails |
| **IDE integration** | ACP (JSON-RPC stdio) | Hooks-adapter architecture |
| **Self-improvement** | DSPy + GEPA evolutionary search | Manual + LLM-assisted via skills |
| **License** | MIT | Proprietary |

## Key Differentiators

### Hermes strengths we lack

1. **Messaging platform breadth:** 20+ platform adapters (Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Email, SMS, etc.) in a single gateway process. Our gateway exists but does not yet match this breadth.

2. **Provider ecosystem depth:** 30+ provider integrations with automatic fallback chains, OAuth flows, auxiliary model routing for side tasks, and credential scoping per base URL.

3. **Memory provider architecture:** Pluggable memory backends with 12 lifecycle hooks including `on_pre_compress` (save insights before context compression discards turns) and `queue_prefetch` (pre-warm for next turn). Our memory extraction is less granular.

4. **Terminal backend diversity:** 6 execution backends (local, Docker, SSH, Daytona, Modal, Singularity) as first-class options switchable via configuration.

5. **Self-evolution:** Companion repo using DSPy + GEPA for evolutionary optimization of skills, prompts, and tool descriptions through reflective search. Cost: $2-10 per optimization run. No GPU training required.

6. **Voice mode:** Real-time voice interaction via CLI, Telegram, and Discord with TTS and transcription support.

7. **Interruptible API calls:** Background-thread API requests with interrupt event monitoring. Main thread can abandon in-flight calls without partial response injection.

### Our strengths Hermes lacks

1. **Multi-harness orchestration:** We drive 10+ agent products through a unified adapter architecture. Hermes is a single agent product.

2. **Durable orchestration:** Run journals, effects, breakpoints, completion proof, state replay, and cross-run state propagation. Hermes has no equivalent.

3. **Structured governance:** Policy engine with categories, decision trails, permission propagation, and posture-based safety profiles. Hermes has simple approval callbacks.

4. **Cross-harness portable plugins:** Our extension system compiles plugins for multiple agent products. Hermes plugins work only within Hermes.

5. **Atlas knowledge graph:** Structured organizational knowledge with graph semantics, layer mapping, and cross-product comparison. Hermes uses flat-file memory.

6. **Process definitions:** Declarative task definitions with phases, subtasks, effects, and breakpoints enabling reproducible multi-step workflows.

7. **Daemon architecture:** Durable queue, automation executor, timer scheduler, and webhook listener for background orchestration.

## Integration Strategy

### Current state

The Hermes hooks adapter at `packages/adapters/hooks/adapter-hermes/` provides basic hook normalization:
- Maps Hermes `onEvent` stdin payloads to unified hook events
- Extracts session ID from `HERMES_SESSION` env var
- Non-blocking, post-direction only (cannot block or deny tool calls)
- Shell-hook family adapter

### Planned integration path

1. **Transport upgrade:** Extend adapter-hermes to leverage Hermes' TUI Gateway JSON-RPC protocol or API server for richer bidirectional control (session management, model switching, approval handling) beyond the current shell-hook approach.

2. **Gateway bridge:** Connect Hermes' 20+ messaging platform adapters as delivery channels for babysitter-orchestrated run results. A babysitter process could route notifications, approvals, and results to Telegram/Discord/Slack via Hermes gateway.

3. **Memory synchronization:** Build a babysitter plugin that synchronizes crossRunState with Hermes' MEMORY.md/USER.md, leveraging the memory provider lifecycle hooks for bidirectional knowledge sharing.

4. **Provider catalog exposure:** Surface Hermes' 30+ provider catalog through our adapters proxy, enabling babysitter runs to access providers not directly supported by the primary harness.

## Feature Parity Matrix

| Feature | Hermes | Our Stack | Parity |
|---------|--------|-----------|--------|
| Agent loop | AIAgent class | Upstream harness | Different approach |
| Multi-provider | 30+ providers | Via harness | Hermes ahead |
| Provider fallback | Ordered chains | Not applicable | Hermes unique |
| Tool system | 70+ tools, auto-discovery | Focused agentic tools | Hermes broader |
| Terminal backends | 6 (local/Docker/SSH/Daytona/Modal/Singularity) | Local + Docker | Hermes ahead |
| Messaging gateway | 20+ platforms | Gateway with fewer | Hermes ahead |
| Plugin system | Internal plugins | Cross-harness plugins | We are ahead |
| Memory | Pluggable providers, 12 hooks | crossRunState, atlas graph | Different strengths |
| Session persistence | SQLite + FTS5 | Event-sourced journals | Different approach |
| Context compression | 50%/85% thresholds | Compaction via harness | Hermes more granular |
| Prompt caching | Anthropic cache breakpoints | Via harness | Similar |
| Subagent delegation | delegate_task tool | Multi-harness orchestration | We are ahead |
| Cron scheduling | Native SQLite scheduler | Daemon timer scheduler | Similar |
| Slash commands | CLI + gateway commands | Interaction primitives | Similar |
| Voice mode | TTS + transcription | Not supported | Hermes unique |
| IDE integration | ACP (VS Code, Zed, JetBrains) | Via harness native | Different approach |
| Self-evolution | DSPy + GEPA | Not supported | Hermes unique |
| Governance | Approval callbacks | Structured engine | We are ahead |
| Durable orchestration | None | Journals, effects, breakpoints | We are ahead |
| Cross-run state | None | crossRunState | We are ahead |
| Multi-agent coordination | Subagent only | Multi-harness orchestration | We are ahead |
| Knowledge graph | None | Atlas graph | We are ahead |

## File Index

| File | Description |
|------|-------------|
| `docs/hermes-research/raw/` | 13 raw documentation files fetched from Hermes docs and GitHub |
| `docs/hermes-research/layer-analysis.md` | Layer-by-layer analysis mapping Hermes to atlas stack |
| `docs/hermes-research/integration-plan.md` | Adapter implementation, hook wiring, and test strategy |
| `docs/hermes-research/README.md` | This synthesis document |
| `packages/atlas/graph/agent-stack/hermes/` | Atlas graph YAML nodes for Hermes subsystems |
| `packages/adapters/hooks/adapter-hermes/` | Existing Hermes hooks adapter (current integration point) |
