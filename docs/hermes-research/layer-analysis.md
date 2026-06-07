# Hermes Agent -- Layer Analysis

Systematic mapping of Hermes Agent subsystems to the atlas agentic stack layers (L1-L14).

---

## L1 -- Model

**What Hermes has:** No model layer; Hermes is model-agnostic.

**Mapping:** Identical posture to our stack -- both consume models, neither own one.

---

## L2 -- Provider

**What Hermes has:** A plugin-based provider runtime resolver (`hermes_cli/runtime_provider.py`, `hermes_cli/auth.py`) supporting 30+ provider integrations. Providers are declared as plugins in `plugins/model-providers/<name>/` and register via `register_provider()`. Each plugin specifies `api_mode`, `base_url`, `env_vars`, and `fallback_models`. Nous Portal acts as a meta-provider routing 300+ models through a single OAuth login.

**Our equivalent:** The adapters proxy (`packages/adapters/proxy/`) handles provider routing for multi-harness scenarios. Individual harnesses own their own provider resolution.

**Unique to Hermes:**
- First-class fallback provider chains with ordered `(provider, model)` pairs tried sequentially on errors.
- Three API modes (`chat_completions`, `codex_responses`, `anthropic_messages`) with automatic base-URL heuristic detection.
- Credential scoping per base URL to prevent API key leakage to wrong endpoints.
- OAuth-based Nous Portal meta-provider covering 300+ models.
- Auxiliary model routing for side tasks (vision, summarization, memory) independent of the primary provider.

**Gaps in Hermes we cover:** Our adapters proxy provides a cross-harness provider routing layer; Hermes provider resolution is internal to a single agent instance.

**Integration opportunities:** Hermes provider resolution could feed into our adapters proxy as a provider backend, exposing its 30+ provider catalog to babysitter-orchestrated runs.

---

## L3 -- Transport

**What Hermes has:** Three wire protocols exposed through the `AIAgent`:
- `chat_completions` -- OpenAI-compatible via `openai.OpenAI` client
- `codex_responses` -- OpenAI Codex/Responses API via `openai.OpenAI` client
- `anthropic_messages` -- Native Anthropic Messages API via `anthropic.Anthropic` client

Resolution order: explicit arg > provider detection > base URL heuristics > default `chat_completions`.

**Our equivalent:** `packages/adapters/transport/` owns transport engines and codecs for different agent harnesses. Each harness adapter in `packages/adapters/hooks/adapter-*` bridges harness-native events to unified format.

**Unique to Hermes:**
- Interruptible API calls via background threads with interrupt event monitoring -- the main thread can abandon an in-flight API call cleanly without injecting partial responses into conversation history.
- Streaming with `stream_delta_callback` and `tool_gen_callback` for real-time token and tool-call previews.

**Gaps in Hermes we cover:** Our transport layer is multi-harness and can bridge across different agent products. Hermes transport is tightly coupled to its single agent runtime.

---

## L4 -- Agent-Core

**What Hermes has:** The `AIAgent` class in `run_agent.py` (~4,400 lines) is the core agent loop. It implements:

- **Prompt assembly:** `prompt_builder.py` constructs ordered tiers (identity > context > volatile), applies Anthropic cache breakpoints, and summarizes when context exceeds thresholds.
- **Turn lifecycle:** Generate task_id > append user message > build/reuse cached system prompt > preflight compression check (>50%) > build API messages > inject ephemeral prompt layers > apply prompt caching > make interruptible API call > parse response (tool calls loop, text response returns).
- **Tool dispatch:** Central registry auto-discovering 70+ tools at import time. Sequential for single calls, `ThreadPoolExecutor` for multiple. Pre/post tool-call plugin hooks. Agent-level tools (todo, memory, session_search, delegate_task) intercepted before general dispatch.
- **Subagent delegation:** `delegate_task` tool spawns child agents with isolated context and independent iteration budgets (capped at `delegation.max_iterations`, default 50).
- **Context compression:** Preflight at 50% context window usage, gateway auto-compression at 85%. Memory flushed before compression, middle turns summarized, last N messages preserved intact, tool call/result pairs kept together.
- **Budget management:** Default 90 iterations, configurable. Subagents get independent budgets.

**Our equivalent:** `packages/genty/platform/` is the platform API for harness integration. The agent core itself lives in the upstream harness (Claude Code, Codex, etc.). For babysitter-orchestrated runs, the `packages/babysitter-sdk/` runtime drives the turn lifecycle via task definitions and effects.

**Unique to Hermes:**
- Single monolithic `AIAgent` class that works identically across CLI, gateway, ACP, batch, and API -- true platform-agnostic core.
- Iteration budget tracking across parent-child agent hierarchy.
- Agent-intercepted tools (todo, memory, session_search) that never reach the general tool dispatch path.
- Fallback model switching mid-conversation when primary model fails.

**Gaps in Hermes we cover:**
- Our multi-harness architecture lets the orchestrator drive different agent products (Claude Code, Codex, Gemini CLI, Hermes) through the same babysitter process definition. Hermes core is limited to its own runtime.
- Our effect system (journal, effects, breakpoints, completion proof) provides durable state tracking that Hermes lacks at the core level.
- Our governance engine (`packages/genty/platform/src/governance/`) provides structured approval, permission, and decision-trail capabilities beyond Hermes' simple `approval_callback`.

**Integration opportunities:** The `AIAgent.chat()` and `AIAgent.run_conversation()` entry points could be wrapped by our adapter-hermes to drive Hermes as a babysitter task executor, passing task instructions as user messages and collecting results.

---

## L5 -- Agent-Runtime

**What Hermes has:**
- **Session persistence:** SQLite storage (`hermes_state.py`) with lineage tracking, platform isolation, contention handling, and FTS5 full-text search with LLM summarization.
- **Built-in tools:** 70+ tools across 28 toolsets spanning terminal, browser, web, MCP, and file operations. Terminal backends support local, Docker, SSH, Daytona, Modal, and Singularity.
- **Hook system:** Plugin hooks with `pre_tool_call` and `post_tool_call` events.
- **Approval system:** `approval_callback` for dangerous command gating.
- **Callback surfaces:** 8 callback types (tool_progress, thinking, reasoning, clarify, step, stream_delta, tool_gen, status).
- **Streaming:** Real-time token streaming and tool call preview.

**Our equivalent:**
- `packages/genty/platform/src/harness/` -- harness adapters, adapter bridge, event mapper, stdin reader.
- `packages/babysitter-sdk/src/` -- core runtime with storage, tasks, hooks, profiles, plugins, compression.
- `packages/genty/platform/src/governance/` -- approval, permission, decision trail.

**Unique to Hermes:**
- 6 terminal backend options (local, Docker, SSH, Daytona, Modal, Singularity) providing execution environment diversity.
- Tool auto-discovery via import-time registration -- zero manual imports needed.
- 8 distinct callback surfaces for fine-grained runtime observability.
- Session search with FTS5 and LLM-powered summarization.
- Trajectory generation (ShareGPT format) from sessions for training data.

**Gaps in Hermes we cover:**
- Our hooks-adapter architecture normalizes hook events across 10+ agent products. Hermes hooks are internal only.
- Our journal and event-sourced state transitions provide replay and audit capabilities.
- Our streaming renderer provides unified streaming across different harness outputs.
- Our daemon (`packages/genty/platform/src/daemon/`) provides durable background execution, timer scheduling, and webhook listening.

---

## L6 -- Agent-Platform

**What Hermes has:**
- **Plugin system:** Three discovery sources (user `~/.hermes/plugins/`, project `.hermes/plugins/`, pip-installed). Plugins register tools, hooks, and commands. Specialized discovery for memory providers, model backends, context engines, and image generators.
- **Skills framework:** Compatible with agentskills.io standards. Agent-created skills with auto-curation and archival of stale skills. Skills Hub for community sharing.
- **MCP integration:** Support for Model Context Protocol servers configured via `config.yaml`.
- **Gateway (20+ platform adapters):** Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Email, SMS, Mattermost, and more. Unified `MessageEvent` format, authorization (per-platform allowlists, DM pairing), slash command dispatch, hooks, and cron integration.
- **Cron scheduler:** First-class durable SQLite scheduler supporting duration phrases, "every" patterns, cron expressions, and one-shot ISO timestamps. 3-minute hard interrupt for runaway loops. Multi-platform delivery.
- **Self-evolution:** Separate companion repo using DSPy + GEPA for evolutionary optimization of skills, tool descriptions, system prompts, and code through reflective evolutionary search.

**Our equivalent:**
- `packages/adapters/extensions/` -- portable plugin/extension system targeting multiple agent products.
- `packages/adapters/gateway/` -- adapters gateway with auth, fanout, kanban, notifications, pairing.
- `packages/adapters/hooks/` -- hook normalization across 10+ agent adapters.
- `.claude/` plugin structure with skills, commands, hooks, agents.
- `packages/genty/platform/src/daemon/` -- automation executor, timer scheduler, webhook listener.

**Unique to Hermes:**
- 20+ messaging platform adapters in a single gateway process -- far broader platform reach than our current gateway.
- DM pairing authorization flow for onboarding new users.
- Self-evolution system for automated skill/prompt/tool optimization.
- Skills Hub (agentskills.io) community marketplace.
- Cron scheduler with natural-language schedule definition.

**Gaps in Hermes we cover:**
- Our multi-harness adapter architecture lets plugins work across Claude Code, Codex, Gemini CLI, Hermes, and others. Hermes plugins work only within Hermes.
- Our babysitter plugin governance provides structured policy, risk, and audit controls.
- Our process definition system (tasks, effects, breakpoints, journals) provides durable orchestration absent from Hermes.
- Our atlas graph provides structured metadata about the entire agent ecosystem.

**Integration opportunities:** Hermes gateway adapters could serve as delivery channels for babysitter-orchestrated results. A babysitter process could use Hermes as the execution harness and route results to Telegram/Discord/Slack via the gateway.

---

## L7 -- Workspace

**What Hermes has:** Working directory binding through sessions. ACP sessions carry editor workspace context via task-scoped terminal/file overrides. Terminal backends (Docker, SSH, etc.) provide different workspace materialization strategies.

**Our equivalent:** Our workspace layer is handled by the upstream harness (git worktrees via Claude Code, sandbox directories via Codex, etc.).

**Unique to Hermes:** Multi-backend workspace materialization (local, Docker, SSH, Daytona, Modal, Singularity) as first-class runtime options.

---

## L8 -- Execution

**What Hermes has:** Tool execution via 70+ tools across 28 toolsets. Sequential execution for single calls, `ThreadPoolExecutor` for concurrent calls. Terminal backends for diverse execution environments. Browser automation, web scraping, image generation, TTS.

**Our equivalent:** `packages/genty/platform/src/harness/agenticTools/` -- background tools, browser tools, config tools, discovery tools, code tools.

**Unique to Hermes:** 6 terminal backend options with environment isolation. Broader tool count (70+ vs our focused set).

---

## L9 -- Sandbox

**What Hermes has:** Docker and Singularity terminal backends provide sandboxed execution. `approval_callback` gates dangerous commands.

**Our equivalent:** `packages/genty/platform/src/governance/sandboxPolicy.ts`, `sandboxBridge.ts` -- sandbox policy enforcement. Docker-based execution via `packages/adapters/docker/`.

---

## L10 -- Interaction

**What Hermes has:**
- CLI slash commands with autocomplete (`/help`, `/tools`, `/model`, `/personality`, `/resume`, `/retry`, `/undo`, `/stop`, `/new`, `/reset`).
- Gateway slash commands with authorization and running-agent guard.
- Voice mode with real-time interaction via CLI, Telegram, Discord.
- Multiline input (Alt+Enter, Ctrl+J, Shift+Enter).
- Interruption via new message or Ctrl+C.

**Our equivalent:** `packages/genty/platform/` interaction primitives. Atlas `interaction-primitives/` YAML definitions.

**Unique to Hermes:** Voice mode with real-time TTS and transcription. Mid-task model hot-swapping via `/model` slash command.

---

## L11 -- Presentation

**What Hermes has:**
- Classic CLI using Rich panels and prompt_toolkit with animated spinner.
- Modern TUI -- Node.js Ink-based React frontend communicating via JSON-RPC with Python backend.
- Dashboard that embeds the real TUI through PTY bridging.
- API server with OpenAI-compatible HTTP endpoints + SSE streaming.
- ACP adapter for IDE integration (VS Code, Zed, JetBrains).

**Our equivalent:** `packages/genty/tui-plugins/` -- TUI panels for status, cost, governance. Atlas `presentations/` YAML definitions.

**Unique to Hermes:** Dual CLI/TUI rendering with PTY bridging for dashboard. Three programmatic integration protocols (ACP, TUI Gateway JSON-RPC, API Server).

---

## L12 -- Knowledge Fabric

**What Hermes has:**
- **Built-in memory:** `MEMORY.md` (project-scoped) and `USER.md` (user profile) with automatic extraction and persistence.
- **Memory provider plugin system:** Single-select pluggable backends implementing the `MemoryProvider` ABC. Lifecycle hooks: `system_prompt_block()`, `prefetch()`, `queue_prefetch()`, `sync_turn()`, `on_session_end()`, `on_pre_compress()`, `on_memory_write()`.
- **Supermemory integration:** Optional cloud-backed long-term memory.
- **Session search:** FTS5 full-text search across sessions with LLM summarization.
- **Profile isolation:** Each profile gets dedicated config, memory, and sessions.
- **Self-evolution memory:** The companion repo uses execution traces and reflective search to improve skills and prompts.

**Our equivalent:**
- `packages/babysitter-sdk/src/` -- memoryExtraction, crossRunState for durable memory across babysitter runs.
- CLAUDE.md / MEMORY.md file conventions.
- Atlas graph as structured organizational knowledge.

**Unique to Hermes:**
- Pluggable memory provider architecture with rich lifecycle hooks (prefetch, queue_prefetch, sync_turn, on_pre_compress, on_memory_write).
- `on_pre_compress` hook to save insights before context compression discards conversation turns.
- Memory flushed to disk before any context compression -- no data loss.
- Cloud-backed memory integration (Supermemory, Honcho).

**Gaps in Hermes we cover:**
- Our crossRunState provides structured state propagation across babysitter orchestration runs.
- Our atlas graph provides graph-structured organizational knowledge, not just flat file memory.
- Our run-history-insights aggregation provides structured learning from completed runs.

**Integration opportunities:** Hermes memory provider plugin architecture could be exposed as a babysitter plugin that synchronizes memory between babysitter crossRunState and Hermes' `MEMORY.md`/`USER.md` files.

---

## L13 -- Orchestration

**What Hermes has:**
- Subagent delegation via `delegate_task` tool with isolated context and iteration budgets.
- Cron scheduler for recurring tasks.
- Gateway message routing and session management.
- Basic iteration budget enforcement (90 turns default, configurable).

**Our equivalent:**
- `packages/babysitter-sdk/` -- full orchestration runtime with task definitions, effects, breakpoints, journals, completion proof, state replay.
- `packages/genty/platform/src/daemon/` -- durable queue, automation executor, timer scheduler.
- Babysitter process definitions with phases, subtasks, and multi-agent coordination.

**Unique to Hermes:**
- Gateway-level orchestration routing messages across 20+ platforms with session continuity.
- Cron scheduler with natural-language schedule definitions.

**Gaps in Hermes we cover:**
- Durable orchestration with journals, effects, and state replay. Hermes has no equivalent to our run journals.
- Multi-step process definitions with breakpoints, approval gates, and completion proof.
- Multi-agent orchestration across different harness products (not just subagents within Hermes).
- Cross-run state propagation.

---

## L14 -- Governance

**What Hermes has:**
- `approval_callback` for dangerous command gating.
- Profile isolation for multi-instance safety.
- Gateway authorization with per-platform allowlists and DM pairing.
- Dependency pinning with upper bounds and commit SHA requirements (supply-chain protection).
- Self-evolution guardrails: 100% test pass, size constraints, semantic preservation, human code review.

**Our equivalent:**
- `packages/genty/platform/src/governance/` -- authority, mandate, decision trail, permission events, permission propagation, posture bridge, sandbox bridge, sandbox policy.
- Babysitter plugin governance.

**Gaps in Hermes we cover:**
- Structured governance engine with policy evaluation, categories, and decision trail logging.
- Permission propagation across multi-agent hierarchies.
- Posture-based governance with configurable safety profiles.
- Audit evidence and compliance controls.

---

## Summary: Key Architectural Differences

| Dimension | Hermes | Our Stack |
|-----------|--------|-----------|
| Core philosophy | Single monolithic agent with gateway | Multi-harness orchestration platform |
| Agent loop | One `AIAgent` class, all surfaces | Upstream harness owns the loop, we wrap |
| Provider breadth | 30+ providers, 50+ integrations | Provider-agnostic via harness delegation |
| Platform reach | 20+ messaging platforms via gateway | Gateway + multi-harness adapters |
| Plugin scope | Hermes-internal plugins | Cross-harness portable plugins |
| Memory | Pluggable providers with rich hooks | crossRunState + atlas graph |
| Orchestration | Subagent delegation + cron | Durable runs, journals, effects, breakpoints |
| Governance | Approval callbacks + allowlists | Structured engine with decision trails |
| Self-improvement | DSPy + GEPA evolutionary optimization | Manual + LLM-assisted via skills |
