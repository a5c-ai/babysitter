# Reference Comparison

> Archived comparison document. Preserved for historical context; not part of the current normative `reference/` contract.

Survey of comparable open-source projects and parity / gap analysis vs agent-mux.

## Projects surveyed

| Project | Lang | Shape | Adapters | Relevance |
|---|---|---|---|---|
| [paperclipai/paperclip](https://github.com/paperclipai/paperclip) | TS | SDK + adapters | claude, codex, cursor, gemini, opencode, openclaw, pi | Closest structural peer |
| [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban) | Rust | Kanban UI executor layer | claude, copilot, cursor, codex, gemini, qwen, droid, opencode, amp | Broadest adapter set |
| [Th0rgal/sandboxed.sh](https://github.com/Th0rgal/sandboxed.sh) | Rust | Sandbox wrapper | claudecode, gemini, codex, opencode, amp | systemd-nspawn isolation |
| [hiyenwong/matop](https://github.com/hiyenwong/matop) | Rust | Agent monitor | claude-code, openclaw, opencode | Monitoring pattern |
| [SihaoLiu/ai-usage](https://github.com/SihaoLiu/ai-usage) | Rust | Usage analytics | claude, codex, gemini | Pricing + usage aggregation |
| [fotoetienne/gru](https://github.com/fotoetienne/gru) | Rust | Multi-agent runner | claude, codex | `AgentBackend` trait |
| [ryoppippi/ccusage](https://github.com/ryoppippi/ccusage) | TS | Usage CLI | claude, codex, opencode, pi, amp | JSONL session reader family |

## Key patterns observed

### Spawn flags (claude)

All references converge on the same critical flags: `--print --verbose --output-format stream-json --include-partial-messages` plus `--session-id` / `--resume`. **We have** `--print` and `--output-format jsonl`. **Gap**: we are missing `--verbose` and `--include-partial-messages`, and we use `jsonl` instead of `stream-json`. Impact: we may miss partial streaming content blocks.

### Session resume distinction

gru separates `build_claude_command()` (new, `--session-id`) from `build_claude_resume_command()` (`--resume`) to avoid "session already in use" errors. **We** use `--session-id` unconditionally. **Gap**: resume path should prefer `--resume <id>` when the session already exists on disk.

### Event mapping (claude)

gru's `claude_backend.rs` buffers `ContentBlockStart(ToolUse)` until `ContentBlockStop`, then emits one `ToolUse` event with formatted summary. **We** emit `tool_call_start` immediately on any `tool_use`/`tool_call`. **Nuance**: ours is fine because `inputAccumulated` is a string; gru's is more ergonomic for terminal UIs but not for SDK consumers.

### Codex

gru maps `turn.failed` event → error with nested message extraction; falls back to "Turn failed" / "Unknown Codex error". **Our** codex-adapter should audit that fallback coverage. (Followup task.)

### Usage/cost parsing

ccusage and ai-usage both parse **JSONL session files directly** for token counts (cache-creation vs cache-read tracked separately) and compute cost client-side from a `pricing.json`. **We** have `assembleCostRecord` but only emit cost from the terminal `result` event. **Gap**: we don't separately attribute cache-creation vs cache-read tokens.

### Sandboxing

sandboxed.sh uses `systemd-nspawn` for isolation. **We** support `local`, `docker`, `kubernetes`. **Potentially add**: `nspawn` mode as a 4th invocation target for Linux users who want kernel-level isolation without Docker.

### Rust trait = our BaseAgentAdapter

gru's `AgentBackend` trait (build_command / build_resume_command / parse_event / build_interactive_resume_command) maps 1:1 to our adapter surface. We additionally cover: hooks, plugins (MCP), auth detection, session file discovery, config read/write. **We are a superset.**

### paperclip adapter set

paperclip's 7 adapters: claude-local, codex-local, cursor-local, gemini-local, opencode-local, openclaw-gateway, pi-local. **We match** all 7 by name and add: hermes, omp, copilot, agent-mux-remote (11 total). **We are a superset.**

### vibe-kanban adapter set

vibe-kanban covers: claude, copilot, cursor, codex, gemini, qwen, droid, opencode, amp. **Missing from us**: qwen, droid, amp. **Candidate for future adapters.**

## Concrete gap list (actionable)

1. **claude-adapter flags**: add `--verbose`, `--include-partial-messages`, switch `--output-format` to `stream-json`. Gate on capability + add tests.
2. **claude resume**: implement `--resume <id>` path separate from `--session-id` when session exists.
3. **cost attribution**: break out cache-creation vs cache-read tokens in `CostRecord`.
4. **codex error fallback**: audit `parseEvent` for missing-message fallbacks ("Turn failed" / "Unknown error").
5. **new adapters to consider**: qwen, droid, amp — each exists in vibe-kanban and ccusage.
6. **invocation mode: nspawn** — Linux-only sandboxing option alongside docker/k8s.

## Security / scalability notes

- None of the references do full privilege-dropping in `local` mode; sandboxed.sh delegates to nspawn. We match this baseline.
- All references read session JSONL lazily and stream line-by-line — we do the same (`parseJsonlSessionFile`).
- No reference we saw does MCP plugin lifecycle management — **we are ahead** here.
- No reference we saw exposes a CLI surface as broad as ours (`amux` has run, sessions, hooks, plugins, detect, doctor, config).

## Conclusion

agent-mux is a **structural superset** of every reference project surveyed. The actionable gaps are narrow and mostly in the **claude streaming flags** and **cost attribution granularity**. Filed as followups in the issue tracker.

## Appendix: Per-file deep-dive (2026-04-12)

Source-level comparison of seven reference executors against our adapters in `packages/adapters/src/`. Line numbers below reference the upstream files fetched on 2026-04-12.

### 1. vibe-kanban `crates/executors/src/executors/claude.rs` vs `claude-adapter.ts`

**Spawn flags (upstream L244-275):** `-p`, `--permission-prompt-tool=stdio`, `--permission-mode={mode}`, `--disallowedTools=AskUserQuestion`, `--dangerously-skip-permissions`, `--model`, `--effort`, `--agent`, `--verbose`, `--output-format=stream-json`, `--input-format=stream-json`, `--include-partial-messages`, `--replay-user-messages`. Router mode wraps `npx -y @musistudio/claude-code-router@1.0.66 code`.

**Our `buildSpawnArgs` (L156-201):** only emits `--output-format`, `--model`, `--session-id`, `--max-turns`, `--dangerously-skip-permissions`, `--system-prompt`, `--print`. Missing: `--verbose`, `--input-format=stream-json`, `--include-partial-messages`, `--replay-user-messages`, `--permission-prompt-tool=stdio` / `--permission-mode`, `--disallowedTools`, `--effort`, `--agent`, and the claude-code-router backend entirely.

**parseEvent branches (upstream ClaudeJson L1641-1732, 13 variants):** System, Assistant, User, ToolUse, ToolResult, StreamEvent (message_start/content_block_start/content_block_delta/message_stop), Result, ApprovalRequested, ApprovalResponse, QuestionResponse, ControlRequest/Response/CancelRequest, RateLimitEvent, Unknown.

**Our parseEvent (L203-271):** only handles `assistant|text`, `tool_use|tool_call`, `tool_result`, `thinking`, `error`, `result`. Missing: `system`, `user`, `stream_event` (no message_start / content_block_delta unwrapping — real Claude Code stream-json will be swallowed), `approval_requested`, `approval_response`, `question_response`, `control_request`, `control_response`, `control_cancel_request`, `rate_limit_event`, Unknown fallback.

**Error mapping:** upstream L48 suppresses `[WARN] Fast mode requires the native binary`; L1572-1581 strips ANSI and categorizes non-JSON stderr as SystemMessage. Ours: no suppression list, no non-JSON fallback.

**Session resume (upstream L320-336):** `--resume <id>` + optional `--resume-session-at <uuid>`. Ours uses `--session-id` for both new and resume (L170) — gru `claude_runner.rs` L31-32 comment warns this causes "session already in use" errors. No `--resume-session-at` support.

**Auth (upstream L676-694):** reads `~/.claude.json` mtime as availability signal; `env_remove("ANTHROPIC_API_KEY")` (L411) when `disable_api_key=true`. Ours reads only `ANTHROPIC_API_KEY` env; no file-mtime signal, no env_remove toggle, and `authFiles` lists `.claude/settings.json` while upstream uses `~/.claude.json`.

### 2. vibe-kanban `codex.rs` vs `codex-adapter.ts`

**Spawn (upstream L378-387):** `npx -y @openai/codex@0.116.0 app-server [--oss]` plus `apply_overrides`. Env L515-521: `NPM_CONFIG_LOGLEVEL=error`, `NODE_NO_WARNINGS=1`, `NO_COLOR=1`, `RUST_LOG=error`.

**Our `buildSpawnArgs` (L142-165):** `--model`, `--full-auto`, `--quiet <prompt>` one-shot. Upstream uses long-running `app-server` JSON-RPC. Missing: `--oss`, npm/node silence env vars, app-server transport.

**parseEvent:** upstream delegates to JsonRpcPeer. Ours parses `message|text`, `function_call|tool_call`, `function_call_output|tool_result`, `error`. Real codex exec --json (gru `codex_backend.rs` L189-253) emits `thread.started`, `turn.started`, `turn.completed` (usage), `turn.failed`, `item.started` (command_execution/file_change/message/generic), `item.completed`, `error` — **none of these are handled**.

**Error mapping (upstream L552-583):** BrokenPipe suppression, AuthRequired distinct variant, "missing stdout/stdin" Io errors, `launch_error`. Ours: no categorization.

**Session resume (upstream L430-452):** `thread_start` vs `thread_fork(fork_params_from(session_id, ...))`. Ours has **no resume plumbing** despite `canResume: true`. Gru uses `codex exec resume --last --json --full-auto` — we do not emit `resume`.

**Auth (upstream L19-27, 465-468, 631-651):** `CODEX_HOME` env → `~/.codex`, `auth.json` mtime for availability, `get_account()` RPC checks `requires_openai_auth`. Our adapter only reads `OPENAI_API_KEY`; missing `CODEX_HOME`, `auth.json` reading; config path should be `config.toml` not `.codex/config.json`.

### 3. vibe-kanban `cursor.rs` vs `cursor-adapter.ts`

**Spawn (upstream L115-129):** `-p`, `--output-format=stream-json`, `--force` OR `--trust`, `--model`. Ours (L122-141): only `--model` and `--prompt`. Missing all stream-json and trust flags. cliCommand is `'cursor'` (L36) but upstream binary is `cursor-agent` — **wrong binary name**.

**parseEvent (upstream L270-500):** System (model-reporting), User (no-op), Assistant (buffer+coalesce), Thinking, ToolCall (Started/Completed subtypes), Result (skip), Unknown → SystemMessage. Ours (L143-181): only `text|message`, `tool_call`, `error`. Missing thinking stream, tool_call split, assistant coalescing, System model-report, Unknown fallback.

**Error mapping (upstream L214-243):** `CURSOR_AUTH_REQUIRED_MSG` → `SetupRequired`. Ours: no auth-stderr detection.

**Session resume (upstream L163-186):** `--resume <session_id>`. Ours emits nothing despite `canResume: true`.

### 4. vibe-kanban `opencode.rs` vs `opencode-adapter.ts`

**Spawn (upstream L109-111):** `npx -y @anomalyco/opencode serve --hostname 127.0.0.1 --port 0` — **HTTP server** transport, not stdout streaming. Ours (L124-143): `opencode --model M --message <prompt>` treated as one-shot streamer — fundamentally wrong transport. Missing: server spawn, URL parsing, `OPENCODE_SERVER_USERNAME`/`OPENCODE_SERVER_PASSWORD` env (L309-310), `build_authenticated_client` (L405), password generation.

**Error mapping (upstream L284-294):** timeout with last 12 lines, premature exit, read-failure. Ours: none.

**Session resume:** upstream passes `resume_session_id` into `RunConfig` (L154, L168). Ours emits nothing.

### 5. gru `src/claude_backend.rs` vs `claude-adapter.ts`

**Spawn (L125-175):** 4 command builders — `build_command` (`--print --verbose --session-id --output-format stream-json --include-partial-messages --dangerously-skip-permissions`), `build_resume_command` (swap `--session-id` → `--resume`), `build_interactive_resume_command` (inherited stdio, no `--print`/`--output-format`), `build_oneshot_command` (`--print --output-format text --max-turns 1 --dangerously-skip-permissions`). Ours: single `buildSpawnArgs`, no interactive/oneshot-text/distinct-resume variants, missing `--verbose` and `--include-partial-messages`.

**parseEvent (L41-117):** MessageStart → Started, ContentBlockStart(ToolUse) buffers, ContentBlockDelta(TextDelta) → TextDelta, ContentBlockDelta(InputJsonDelta) accumulates, ContentBlockStop emits buffered ToolUse via `format_tool_summary`, MessageDelta/MessageStop → MessageComplete, Error, Ping. Ours has none of these stream-json block events — `input_json_delta` accumulation entirely absent.

**Error fallbacks (L223-265):** `format_tool_summary` per-tool fallback strings (`Run: bash command`, `Read: file`, `Tool: {name}`). Ours: no tool-summary formatting.

**Auth:** `GH_HOST` env propagated on all four command variants (L164, tests L188-207). Ours does not propagate `GH_HOST`.

### 6. gru `src/codex_backend.rs` vs `codex-adapter.ts`

**Spawn (L116-162):** `codex exec --json --full-auto [prompt]`; resume `codex exec resume --last --json --full-auto`; oneshot `codex exec --full-auto` (stdin-pipe when prompt=="-"). Ours: `codex --quiet --full-auto`; missing `exec` subcommand, `--json`, `resume --last`, stdin-dash convention.

**parseEvent (L189-253):** `thread.started` → Started, `turn.started` → Thinking, `turn.completed` → MessageComplete+usage, `turn.failed` → Error, `item.started`/`item.completed` split by kind, `error`. We match none of these type strings.

**Error fallbacks (L220-250):** `"Turn failed"` (L229), `"Unknown Codex error"` (L250). Ours: generic passthrough.

**Auth:** `GH_HOST` propagated on all variants (L53-65, L74-79, L107-113). Ours: not propagated.

### 7. gru `src/claude_runner.rs` vs `claude-adapter.ts`

Source-of-truth for claude command shape (L20-44). Both builders pipe stdout, inherit stdin+stderr, set `.env("GH_HOST", ...)`. Confirms gap: our adapter does not inherit stderr, does not set `GH_HOST`, and does not split new-session vs resume to avoid "session already in use" errors (L31-32 comment).

### Summary of gaps identified (30)

See `.a5c/runs/.../state/output.json` for the structured list. Highest-impact clusters: (a) Claude stream-json block-level parsing and flags, (b) Codex `exec --json` subcommand and event vocabulary, (c) Cursor wrong `cliCommand` (`cursor` vs `cursor-agent`) and missing streaming flags, (d) OpenCode wrong transport (HTTP server vs one-shot stdout), (e) absent `GH_HOST`/`CODEX_HOME` env propagation across all OpenAI-adjacent adapters.

## Extended Research: AI Orchestration and Monitoring Ecosystem (2026-04-13)

Following the detailed adapter-level analysis above, this section examines the broader ecosystem of AI agent orchestration, monitoring, and harness management platforms to identify architectural patterns and potential feature gaps.

### New projects surveyed

| Category | Project | Lang | Focus | Relevance |
|---|---|---|---|---|
| Multi-Agent Orchestration | [LangGraph](https://www.langchain.com/) | Python | Graph-based workflows | Complex orchestration patterns |
| Multi-Agent Orchestration | [CrewAI](https://crewai.com/) | Python | Role-playing agents | Agent collaboration (44k+ stars) |
| Multi-Agent Orchestration | [MassGen](https://github.com/massgen/massgen) | Python | Terminal-based scaling | Session memory patterns |
| Multi-Model Abstraction | [LiteLLM](https://github.com/BerriAI/litellm) | Python | Unified API proxy | 100+ provider abstraction |
| Multi-Model Abstraction | [Portkey AI](https://portkey.ai/) | - | Enterprise gateway | Advanced observability |
| Multi-Model Abstraction | [OpenRouter](https://openrouter.ai/) | - | SaaS marketplace | 300+ model coverage |
| Cost Tracking | [TokenBudget](https://github.com/AIMasterLabs/tokenbudget) | JS | Free cost tracking | Real-time dashboard |
| Cost Tracking | [Tokscale](https://github.com/junhoyeo/tokscale) | TS | Multi-harness CLI | Similar scope to agent-mux |
| Cost Tracking | [claude-view](https://recca0120.github.io/en/2026/04/07/claude-view-mission-control/) | JS | Claude dashboard | Real-time monitoring |
| Session Management | [Pipecat AI](https://github.com/pipecat-ai/pipecat) | Python | Voice/multimodal | Complex state management |
| Session Management | OpenAI Agents SDK | Python | Session memory | Context preservation |
| Orchestration | [Haystack](https://haystack.deepset.ai/) | Python | AI pipelines | Production LLM apps |
| Observability | [Langfuse](https://langfuse.com/) | TS | Framework-agnostic | Span-level tracing |
| Observability | [Arize Phoenix](https://arize.com/phoenix/) | Python | ML monitoring | Enterprise observability |
| Observability | Dash0 Agent0 | - | OpenTelemetry-native | AI-powered operations |

### Key architectural patterns observed

#### 1. Abstraction layer positioning

- **API Level** (LiteLLM, OpenRouter, Portkey): Focus on unifying HTTP APIs across providers
- **Framework Level** (LangChain, CrewAI, Haystack): Provide high-level orchestration abstractions
- **Harness Level** (agent-mux): **Unique positioning** - abstracts heterogeneous native CLI tools

**Insight**: Agent-mux occupies a distinct layer that others don't address - the gap between raw harnesses and high-level frameworks.

#### 2. Economic models in the ecosystem

- **Pure Open Source**: TokenBudget, LiteLLM, agent-mux
- **Open Source + Enterprise**: Langfuse, Arize Phoenix  
- **SaaS with markup**: OpenRouter (5% markup)
- **Subscription SaaS**: Portkey ($49/month+)

**Insight**: The pure open-source positioning of agent-mux aligns with developer-focused tools rather than enterprise platforms.

#### 3. Observability approaches

- **Real-time dashboards**: claude-view, TokenBudget, Portkey
- **Span-level tracing**: Langfuse, Arize Phoenix, OpenTelemetry integrations
- **Cost-first monitoring**: TokenBudget, Tokscale, ai-usage (from original survey)

**Gap identified**: Agent-mux lacks a real-time dashboard component for live monitoring across harnesses.

### Competitive positioning analysis

#### Agent-mux unique strengths confirmed

1. **Multi-harness abstraction at CLI level**: No competitor operates at this specific layer
2. **Native session file integration**: Reading `~/.claude/projects`, `~/.codex/sessions` etc. directly
3. **Comprehensive invocation modes**: `local`, `docker`, `ssh`, `k8s` abstraction
4. **Harness-specific feature preservation**: Hooks, plugins, subagents vs. lowest-common-denominator

#### Emerging opportunity areas

##### 1. Real-time monitoring dashboard
**Evidence**: claude-view (Claude-specific), Tokscale (multi-harness CLI), TokenBudget (real-time UI)
**Gap**: No unified dashboard for monitoring runs across all 19+ supported harnesses
**Recommendation**: Build web-based dashboard similar to claude-view but harness-agnostic

##### 2. Advanced workflow orchestration  
**Evidence**: LangGraph (44k+ stars) graph-based workflows, CrewAI multi-agent collaboration
**Gap**: Agent-mux focuses on single-agent runs; limited multi-step orchestration
**Recommendation**: Consider graph-based workflow support for complex multi-harness processes

##### 3. Enterprise observability features
**Evidence**: Portkey semantic caching, Arize anomaly detection, Langfuse production monitoring
**Gap**: Current observability is basic; missing advanced enterprise features
**Recommendation**: Enhance with semantic caching, guardrails, anomaly detection

##### 4. Cost optimization intelligence
**Evidence**: All cost-tracking tools show usage but no optimization recommendations
**Gap**: Industry-wide - everyone tracks costs but none provide optimization suggestions
**Opportunity**: Agent-mux could be first to provide cost optimization recommendations

##### 5. Agent marketplace integration
**Evidence**: Existing plugin/skill ecosystems around specific harnesses
**Gap**: No unified discovery/installation across harnesses
**Recommendation**: Integrate with existing marketplaces per harness

### Architecture pattern implications

#### Session management patterns
**From research**: OpenAI Agents SDK automatic context preservation, MassGen memory isolation, Pipecat Flows state management
**Agent-mux approach**: Native session file reading + resume/fork capabilities  
**Assessment**: Agent-mux approach is more integrated but could benefit from automatic memory management patterns

#### Event streaming normalization
**From research**: Most tools either work at API level (losing CLI-specific events) or single-harness (no normalization needed)
**Agent-mux approach**: Unified `AgentEvent` stream across all adapters
**Assessment**: This remains a unique and valuable architectural choice

#### Cost attribution granularity  
**From research**: ai-usage and ccusage parse session JSONL for cache-creation vs cache-read tokens
**Current gap** (confirmed from original analysis): Agent-mux only emits cost from terminal `result` event
**Implementation path**: Already identified in original analysis as actionable gap #3

### Recommendations for evolution

#### Immediate (high-impact, moderate effort)
1. **Real-time dashboard**: Web-based monitoring UI for live runs across all harnesses
2. **Enhanced cost attribution**: Separate cache-creation vs cache-read tokens (already identified)
3. **Streaming flags completion**: Claude `--verbose --include-partial-messages stream-json` (already identified)

#### Medium-term (high-value, higher effort)  
1. **Workflow orchestration**: Graph-based multi-step processes across harnesses
2. **Advanced observability**: Semantic caching, guardrails, anomaly detection patterns
3. **Marketplace integration**: Unified discovery/installation across harness ecosystems

#### Long-term (strategic differentiation)
1. **Cost optimization AI**: First tool to provide intelligent cost optimization recommendations
2. **Cross-harness session management**: Automatic context preservation across different AI services
3. **Enterprise security features**: Inspired by emerging agent governance toolkits

### Conclusion

The extended research confirms that agent-mux occupies a unique and valuable position in the AI tooling ecosystem. While the original adapter-level analysis identified specific implementation gaps, this broader survey reveals strategic opportunities for differentiation and growth.

Key insight: **No competitor operates at the harness abstraction level that agent-mux has carved out**. The closest competitors (Tokscale, claude-view) either focus on monitoring or single-harness scenarios. Agent-mux's multi-harness CLI abstraction with unified event streams remains architecturally unique.

The opportunity areas identified (real-time monitoring, workflow orchestration, advanced observability) represent natural evolution paths rather than competitive catch-up, positioning agent-mux to lead rather than follow in this space.
