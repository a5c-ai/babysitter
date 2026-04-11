# Glossary & References

Terms, abbreviations, file paths, and cross-codebase references used throughout this gap analysis.

## Glossary

| Term | Definition |
|------|-----------|
| **CC** | Claude Code -- Anthropic's AI coding agent CLI |
| **Harness** | The Babysitter orchestration platform that delegates work to AI CLI tools |
| **Adapter** | A harness adapter wraps a specific AI CLI (Claude Code, Codex, etc.) |
| **Effect** | A side-effect requested by a process (task, breakpoint, sleep, orchestrator_task) |
| **Journal** | Append-only event log for a run, stored in `.a5c/runs/<runId>/journal/` |
| **State Cache** | Derived replay cache rebuilt from journal (`state/state.json`) |
| **Replay** | Deterministic re-execution of a process against its journal |
| **Process** | A JS function (`async function process(inputs, ctx)`) that defines orchestration logic |
| **Run** | A single execution of a process, stored in `.a5c/runs/<runId>/` |
| **Breakpoint** | A human approval gate in a process; may be auto-approved by rules |
| **Strata** | Prompt assembly layers: stable (cached), runtime (per-session), turn-local (per-turn) |
| **Compaction** | Summarizing or condensing session history to fit within context windows |
| **MCP** | Model Context Protocol -- standard for AI tool integration |
| **Pi** | A coding agent with programmatic session support |
| **Agentic Tools** | 16 tool definitions injectable into Pi sessions |
| **Observer Dashboard** | Real-time monitoring UI for babysitter runs |
| **Process Library** | Git-based repository of reusable process definitions |

## Gap ID Prefixes

| Prefix | Category | Directory |
|--------|----------|-----------|
| GAP-TOOLS-xxx | Tools & Capabilities | [gaps/tools-capabilities/](./gaps/tools-capabilities/) |
| GAP-UX-xxx / GAP-USER-xxx | User Experience | [gaps/user-experience/](./gaps/user-experience/) |
| GAP-PERF-xxx | Performance | [gaps/performance/](./gaps/performance/) |
| GAP-AGENT-xxx | Agent Delegation | [gaps/agent-delegation/](./gaps/agent-delegation/) |
| GAP-REMOTE-xxx | Remote Integration | [gaps/remote-integration/](./gaps/remote-integration/) |
| GAP-STATE-xxx | State Continuity | [gaps/state-continuity/](./gaps/state-continuity/) |
| GAP-OBS-xxx | Observability | [gaps/observability/](./gaps/observability/) |
| GAP-SEC-xxx | Security | [gaps/security/](./gaps/security/) |
| GAP-ECO-xxx | Ecosystem | [gaps/ecosystem/](./gaps/ecosystem/) |
| GAP-PROMPT-xxx | Prompt Engineering | [gaps/prompt-engineering/](./gaps/prompt-engineering/) |
| GAP-PAR-xxx | Parallelization | [gaps/parallelization/](./gaps/parallelization/) |
| GAP-JSON-xxx | JSON Interaction | [gaps/json-interaction/](./gaps/json-interaction/) |
| GAP-SUBOBS-xxx | Subagent Observability | [gaps/subagent-observability/](./gaps/subagent-observability/) |
| GAP-HADAPT-xxx | Harness Adaptation | [gaps/harness-adaptation/](./gaps/harness-adaptation/) |
| GAP-SESSION-xxx | Session Management | [gaps/session-management/](./gaps/session-management/) |
| GAP-MCPC-xxx | MCP Channels | [gaps/mcp-channels/](./gaps/mcp-channels/) |
| GAP-PROC-xxx | Process Composition | [gaps/process-composition/](./gaps/process-composition/) |
| GAP-ROUTE-xxx | Effect Routing | [gaps/effect-routing/](./gaps/effect-routing/) |
| GAP-BRK-xxx | Breakpoint Workflows | [gaps/breakpoint-workflows/](./gaps/breakpoint-workflows/) |
| GAP-RUN-xxx | Run Lifecycle | [gaps/run-lifecycle/](./gaps/run-lifecycle/) |
| GAP-OBS-NEW-xxx | Observer Integration | [gaps/observer-integration/](./gaps/observer-integration/) |
| GAP-PROF-xxx | Profile Orchestration | [gaps/profile-orchestration/](./gaps/profile-orchestration/) |

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| **Critical** | Blocks key use cases or creates significant risk | Immediate action required (Phase 1-2) |
| **High** | Major capability gap affecting daily workflows | Address in near-term (Phase 2-3) |
| **Medium** | Notable gap with workarounds available | Plan for medium-term (Phase 3-4) |
| **Low** | Nice-to-have; minimal impact on core workflows | Address opportunistically (Phase 5) |

## Effort Sizes

| Size | Description | Approximate Duration |
|------|-------------|---------------------|
| **S** (Small) | Straightforward change, well-understood scope | 1-2 days |
| **M** (Medium) | Multi-file change, some design decisions | 3-5 days |
| **L** (Large) | New module or significant refactor | 1-3 weeks |
| **XL** (Extra Large) | Major infrastructure, cross-cutting concerns | 3-8 weeks |

## Key File References (Harness Codebase)

### Core SDK

| Component | Path |
|-----------|------|
| CLI entry | `packages/sdk/src/cli/main.ts` |
| MCP entry | `packages/sdk/src/cli/mcpServeEntry.ts` |
| Runtime | `packages/sdk/src/runtime/` |
| Orchestrate iteration | `packages/sdk/src/runtime/orchestrateIteration.ts` |
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Exceptions | `packages/sdk/src/runtime/exceptions.ts` |
| Replay engine | `packages/sdk/src/runtime/replay/createReplayEngine.ts` |
| Replay cursor | `packages/sdk/src/runtime/replay/replayCursor.ts` |
| Effect index | `packages/sdk/src/runtime/replay/effectIndex.ts` |
| State cache | `packages/sdk/src/runtime/replay/stateCache.ts` |

### Storage & Tasks

| Component | Path |
|-----------|------|
| Storage module | `packages/sdk/src/storage/` |
| Task definitions | `packages/sdk/src/tasks/` |
| Task serializer | `packages/sdk/src/tasks/serializer.ts` |
| Task registry | `packages/sdk/src/tasks/registry.ts` |
| Task batching | `packages/sdk/src/tasks/batching.ts` |

### Harness Adapters

| Component | Path |
|-----------|------|
| Adapter directory | `packages/sdk/src/harness/` |
| Harness discovery | `packages/sdk/src/harness/discovery.ts` |
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Pi wrapper | `packages/sdk/src/harness/piWrapper.ts` |
| Pi secure sandbox | `packages/sdk/src/harness/piSecureSandbox.ts` |
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| Adapter registry | `packages/sdk/src/harness/registry.ts` |
| Install support | `packages/sdk/src/harness/installSupport.ts` |

### Plugins & Extensions

| Component | Path |
|-----------|------|
| Plugin types | `packages/sdk/src/plugins/types.ts` |
| Plugin registry | `packages/sdk/src/plugins/registry.ts` |
| Plugin marketplace | `packages/sdk/src/plugins/marketplace.ts` |
| Plugin migrations | `packages/sdk/src/plugins/migrations.ts` |
| Plugin package reader | `packages/sdk/src/plugins/packageReader.ts` |
| Process library | `packages/sdk/src/processLibrary/` |

### Security & Breakpoints

| Component | Path |
|-----------|------|
| Breakpoint types | `packages/sdk/src/breakpoints/types.ts` |
| Breakpoint patterns | `packages/sdk/src/breakpoints/patterns.ts` |
| Breakpoint rules | `packages/sdk/src/breakpoints/rules.ts` |
| Breakpoint evaluator | `packages/sdk/src/breakpoints/evaluator.ts` |

### Interaction & Prompts

| Component | Path |
|-----------|------|
| Interaction module | `packages/sdk/src/interaction/` |
| Prompts module | `packages/sdk/src/prompts/` |
| Compression module | `packages/sdk/src/compression/` |
| Session management | `packages/sdk/src/session/` |
| Profiles | `packages/sdk/src/profiles/` |

### Observability

| Component | Path |
|-----------|------|
| Logging module | `packages/sdk/src/logging/` |
| Hooks | `packages/sdk/src/hooks/` |
| Hook dispatcher | `packages/sdk/src/hooks/dispatcher.ts` |
| Observer dashboard | `packages/observer-dashboard/` |
| Catalog | `packages/catalog/` |
| Config | `packages/sdk/src/config/` |

### Harness Plugins

| Plugin | Path |
|--------|------|
| Claude Code plugin | `plugins/babysitter/` |
| Codex plugin | `plugins/babysitter-codex/` |
| Cursor plugin | `plugins/babysitter-cursor/` |
| Gemini plugin | `plugins/babysitter-gemini/` |
| GitHub Copilot plugin | `plugins/babysitter-github/` |
| Pi plugin | `plugins/babysitter-pi/` |
| oh-my-pi plugin | `plugins/babysitter-omp/` |
| Paperclip plugin | `plugins/babysitter-paperclip/` |
| Marketplace | `plugins/a5c/marketplace/` |

## CC Feature Reference (from inventory)

| CC Feature | Category |
|-----------|----------|
| 43+ native tools | Tools |
| Ink/React TUI | UX |
| Voice mode (STT/TTS) | UX |
| Vim mode | UX |
| Ephemeral prompt caching | Performance |
| Multi-mode compaction | Performance |
| AgentTool (subagents) | Agent |
| TeamCreateTool (swarms) | Agent |
| SendMessageTool (messaging) | Agent |
| Daemon mode | Remote |
| Bridge mode (IDE) | Remote |
| Remote sessions (WebSocket) | Remote |
| extractMemories | State |
| autoDream | State |
| SessionMemory | State |
| policyLimits | Security |
| PermissionRequest hooks | Security |
| Datadog/Growthbook analytics | Observability |
| Feature gates (20+) | Ecosystem |
| MagicDocs | Ecosystem |

## Source Data Files

| Data | Path |
|------|------|
| CC Inventory | `.a5c/runs/01KNK8KEQCFNM1BTZW931FFXEW/tasks/01KNK8M2MZP6Z1YTCZQ3037SJT/output.json` |
| Harness Inventory | `.a5c/runs/01KNK8KEQCFNM1BTZW931FFXEW/tasks/01KNK8M2N0GR1WZPYDYP4ZQ8PR/output.json` |
| Gap Analysis (100 gaps) | `.a5c/runs/01KNK8KEQCFNM1BTZW931FFXEW/tasks/01KNK99FX28B53JE5DVK6S8QXH/output.json` |
