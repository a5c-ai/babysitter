# Built-in Adapter Implementations

**Specification v1.0** | `@a5c-ai/agent-mux`

> **SCOPE EXTENSION:** hermes-agent (`@NousResearch/hermes-agent`) is included as a 10th supported agent per explicit project requirements from the project owner. It extends the original scope document's 9 built-in agents. All hermes-specific content in this spec is marked with this same scope extension note.
>
> **SCOPE EXTENSION (2026-04):** `agent-mux-remote` (11th, transport-only) and `qwen` (12th, Alibaba Qwen Code — a gemini-cli fork with MCP support) were added beyond the original 10. See [agents/qwen.md](agents/qwen.md) for qwen usage.

---

## 1. Overview

This specification defines the implementation details for all 13 built-in adapter implementations in `@a5c-ai/agent-mux`. Each adapter extends `BaseAgentAdapter` (spec 05 §4) and translates between the unified `AgentAdapter` interface and the native CLI of its target agent.

This is the reference document for adapter authors and consumers who need to understand per-agent behavioral differences. It covers CLI arguments, event parsing, session formats, thinking normalization, install methods, auth detection, plugin delegation, and platform-specific notes for each adapter.

### 1.1 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `AgentAdapter` interface | `05-adapter-system.md` | 2 |
| `BaseAgentAdapter` abstract class | `05-adapter-system.md` | 4 |
| `SpawnArgs` type | `05-adapter-system.md` | 3.1 |
| `AdapterRegistry` | `05-adapter-system.md` | 5 |
| `AgentCapabilities` | `06-capabilities-and-models.md` | 2 |
| `ModelCapabilities` | `06-capabilities-and-models.md` | 5 |
| Thinking normalization tables | `06-capabilities-and-models.md` | 8 |
| Install metadata | `06-capabilities-and-models.md` | 7 |
| Capability profiles (complete) | `06-capabilities-and-models.md` | 12 |
| Plugin support per agent | `06-capabilities-and-models.md` | 9 |
| Config file locations | `08-config-and-auth.md` | 7 |
| Auth detection strategies | `08-config-and-auth.md` | 10.1 |
| AuthMethod, AuthState | `08-config-and-auth.md` | 10, 9 |
| Session formats | `07-session-manager.md` | 5 |
| Process lifecycle, PTY | `11-process-lifecycle-and-platform.md` | 6 |
| Platform support matrix | `11-process-lifecycle-and-platform.md` | 5 |
| `AgentEvent` union | `04-agent-events.md` | 4 |
| `ErrorCode` union | `01-core-types-and-client.md` | 3.1 |
| Scope §20 summary table | `agent-mux-scope.md` | 20 |

---

## 2. Built-in Adapter Summary

From scope §20, extended with hermes-agent:

| Adapter | CLI | `cliCommand` | Session | Stream | Resume | Fork | Thinking | MCP | Skills | Plugins | ACP | Platforms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Claude Code | `claude` | `claude` | JSONL | yes | yes | yes | yes | yes | yes | partial | no | all |
| Codex CLI | `codex` | `codex` | JSONL | yes | no | no | yes | yes | no | no | no | all |
| Gemini CLI | `gemini` | `gemini` | JSONL | yes | no | no | yes | yes | no | no | no | all |
| Copilot CLI | `gh copilot` | `copilot` | JSON | yes | no | no | no | no | no | no | no | all |
| Cursor | `cursor` | `cursor` | SQLite | partial | no | no | model-dep | yes | no | yes | no | all |
| OpenCode | `opencode` | `opencode` | SQLite | yes | yes | yes | model-dep | yes | yes | yes | yes | all |
| OpenCode HTTP | `opencode serve` | `opencode-http` | SQLite | yes | yes | yes | model-dep | yes | yes | yes | yes | all |
| Pi | `pi` | `pi` | JSONL tree | yes | yes | yes | model-dep | no | yes | yes | yes | all |
| omp | `omp` | `omp` | JSONL tree | yes | yes | yes | yes | no | yes | yes | yes | all (Win partial) |
| OpenClaw | `openclaw` | `openclaw` | JSON | partial | no | no | model-dep | yes | yes | yes | no | all |
| hermes | `hermes` | `hermes` | SQLite | yes | yes | no | no | yes | yes | yes | yes | darwin/linux |

> **SCOPE EXTENSION:** hermes-agent row added.

**Column notes:**
- **CLI**: The actual command invoked. For copilot, the command is `gh` with args `['copilot', ...]` (see §5).
- **`cliCommand`**: The `AgentAdapter.cliCommand` property value (logical agent name).
- **Stream**: "yes" = full text+tool+thinking streaming; "partial" = text streaming only.
- **Resume**: Whether `canResume: true` in capabilities.
- **Fork**: Whether `canFork: true` in capabilities.
- **Thinking**: "yes" = always supported; "model-dep" = depends on `ModelCapabilities.supportsThinking`; "no" = not supported.
- **Plugins**: "partial" for Claude = limited to skill-directory and mcp-server formats via `--add-dir`.
- **Platforms**: "all" = darwin, linux, win32; "all (Win partial)" = all three platforms but with reduced Windows functionality; "darwin/linux" = no native Windows support.

---

## 3. Claude Code Adapter

> **Implementation note (2026-04):** The `claude` adapter now uses Claude Code's real `--print` + `--input-format stream-json` + `--output-format stream-json` subprocess transport for live sessions. That lets agent-mux keep a single Claude subprocess alive and deliver later user turns over stdin while continuing to parse structured stream-json events from stdout. `claude remote-control` is now modeled separately as the `claude-remote-control` adapter: an external-host bridge surface for Claude.ai / Claude app sessions, not a local browser chat transport. Claude channels remain a separate MCP-mediated Claude surface and are still not represented as a first-class adapter.

### 3.1 Identity

| Property | Value |
|---|---|
| `agent` | `'claude'` |
| `displayName` | `'Claude Code'` |
| `cliCommand` | `'claude'` |
| `minVersion` | `'1.0.0'` |

### 3.2 buildSpawnArgs

```typescript
// Key CLI arguments
SpawnArgs {
  command: 'claude',
  args: [
    '--print',                             // Required for structured output
    '--input-format', 'stream-json',       // Persistent stdin-driven user turns
    '--output-format', 'stream-json',      // Streaming JSON output
    '--replay-user-messages',              // Echo stdin user turns back on stdout
    '--model', modelId,                    // Model selection
    '--thinking-budget', budgetTokens,     // Thinking (when enabled)
    '--session', sessionId,                // Resume session
    '--add-dir', skillDir,                 // Skill directories
    '--system', systemPrompt,              // System prompt injection
    '--system-mode', systemPromptMode,     // prepend | append | replace
    '--max-turns', maxTurns,
  ],
  env: { ANTHROPIC_API_KEY: apiKey },
  usePty: false,
}
```

**Prompt delivery:** Interactive Claude sessions use `SpawnArgs.stdin` and send newline-delimited `stream-json` user envelopes (`{ type: 'user', message: { role: 'user', content }, parent_tool_use_id: null }`) into the live Claude subprocess. Explicit `nonInteractive=true` falls back to a one-shot `--print <prompt>` invocation that exits after the first turn.

### 3.3 Event Parsing

**Native format:** Newline-delimited JSON (stream-json). Each line is a JSON object with a `type` field.

**Key native event types and their AgentEvent mappings:**

| Native type | AgentEvent type(s) |
|---|---|
| `message_start` | `message_start` |
| `content_block_start` (text) | (consumed internally — text streaming begins) |
| `content_block_delta` (text) | `text_delta` |
| `content_block_start` (thinking) | `thinking_start` |
| `content_block_delta` (thinking) | `thinking_delta` |
| `content_block_stop` (thinking) | `thinking_stop` |
| `content_block_start` (tool_use) | `tool_call_start` |
| `content_block_delta` (tool_use) | `tool_input_delta` (incremental tool input) |
| `content_block_stop` (tool_use) | `tool_call_ready` |
| replayed `user` event with `parent_tool_use_id` + `tool_use_result` | `tool_result` |
| `message_delta` | (cost extraction → `cost` event) |
| `message_stop` | `message_stop` |
| `system.status=requesting` | `turn_start` |
| `result` | `turn_end` (+ fallback `message_stop` / `cost` when needed) |

**Session lifecycle events:** When resuming a session (`--session`), the adapter emits `session_resume` after `session_start`. When forking (`--fork`), it emits `session_fork`. These events are synthesized by the adapter from the session metadata, not from native Claude output.

### 3.4 Session Format

- **Location:** `~/.claude/projects/<hash>/` where `<hash>` is a content-hash of the project path.
- **Format:** JSONL (one JSON object per line).
- **Capabilities:** `canResume: true`, `canFork: true`, `sessionPersistence: 'file'`.

### 3.5 Thinking Normalization

| Effort | Mapping | CLI arg |
|---|---|---|
| `'low'` | `budget_tokens: 1024` | `--thinking-budget 1024` |
| `'medium'` | `budget_tokens: 8192` | `--thinking-budget 8192` |
| `'high'` | `budget_tokens: 32768` | `--thinking-budget 32768` |
| `'max'` | `budget_tokens: max_budget_tokens` | `--thinking-budget max_budget_tokens` |

`thinkingBudgetTokens` is passed through directly. `thinkingOverride` is merged last.

### 3.6 Install Methods

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @anthropic-ai/claude-code` |
| darwin | brew | `brew install claude-code` |

### 3.7 Auth Detection

- **Primary:** `browser_login` — inspects session token files in `~/.claude/` (per spec 08 §10.1).
- **Alternative:** `api_key` — checks `ANTHROPIC_API_KEY` environment variable.

> **Cross-spec reconciliation:** Spec 06 §12.1 lists auth methods as `['api-key','oauth']` while spec 08 §10.1 lists primary method as `browser_login`. This spec follows spec 08 as the authoritative source for auth detection. The `browser_login` method describes the detection strategy (checking local session tokens), while `api-key` and `oauth` in spec 06 describe the underlying credential types.

### 3.8 Plugin Support

- **`supportsPlugins`:** `true` (partial — limited to skill-directory and mcp-server formats).
- **Formats:** `['skill-directory', 'mcp-server']`.
- **Mechanism:** `--add-dir` flag for skill directories; MCP servers via config.
- **No dedicated plugin install/list/uninstall commands.** Plugin operations are mapped to config file manipulation.
- **No marketplace URL.** No registry.

---

## 4. Codex CLI Adapter

### 4.1 Identity

| Property | Value |
|---|---|
| `agent` | `'codex'` |
| `displayName` | `'Codex CLI'` |
| `cliCommand` | `'codex'` |
| `minVersion` | `'1.0.0'` |

### 4.2 buildSpawnArgs

```typescript
SpawnArgs {
  command: 'codex',
  args: [
    prompt,
    '--model', modelId,
    '--reasoning', reasoningLevel,   // 'low' | 'medium' | 'high'
    '--session', sessionId,
  ],
  env: { OPENAI_API_KEY: apiKey },
  usePty: false,
}
```

### 4.3 Event Parsing

**Native format:** JSONL. OpenAI-style structured events.

**Key native event types and their AgentEvent mappings:**

| Native type | AgentEvent type(s) |
|---|---|
| `response.start` | `message_start` |
| `response.text.delta` | `text_delta` |
| `response.reasoning.start` | `thinking_start` |
| `response.reasoning.delta` | `thinking_delta` |
| `response.reasoning.complete` | `thinking_stop` |
| `response.function_call` | `tool_call_start` |
| `response.function_call.delta` | `tool_input_delta` (when streaming tool input) |
| `response.function_call.complete` | `tool_call_ready` |
| `response.function_call_output` | `tool_result` |
| `response.cost` | `cost` |
| `response.complete` | `message_stop` |
| `error` | `error` |

### 4.4 Session Format

- **Location:** `~/.codex/sessions/`
- **Format:** JSONL.
- **Capabilities:** `canResume: false`, `canFork: false`, `sessionPersistence: 'file'`.

> **Note:** Spec 06 §12.2 confirms `canResume=false, canFork=false` for Codex CLI.

### 4.5 Thinking Normalization

| Effort | Mapping | CLI arg |
|---|---|---|
| `'low'` | `'low'` | `--reasoning low` |
| `'medium'` | `'medium'` | `--reasoning medium` |
| `'high'` | `'high'` | `--reasoning high` |
| `'max'` | `'high'` | `--reasoning high` (no separate max tier) |

**Note:** Codex uses discrete reasoning levels, not token budgets. Setting `thinkingBudgetTokens` when `supportsThinkingBudgetTokens: false` throws `CapabilityError` before spawning, per spec 06 §11.

### 4.6 Install Methods

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @openai/codex` |

### 4.7 Auth Detection

- **Primary:** `api_key` — checks `OPENAI_API_KEY` environment variable (validates format: must start with `'sk-'`).
- **Auth file:** `~/.codex/auth.json`.

### 4.8 Plugin Support

- **`supportsPlugins`:** `false`.
- All plugin operations throw `CapabilityError`.

---

## 5. Copilot CLI Adapter

### 5.1 Identity

| Property | Value |
|---|---|
| `agent` | `'copilot'` |
| `displayName` | `'GitHub Copilot CLI'` |
| `cliCommand` | `'copilot'` |
| `minVersion` | `'1.0.0'` |

### 5.2 buildSpawnArgs

```typescript
// Note: cliCommand is 'copilot' but actual command is 'gh'
SpawnArgs {
  command: 'gh',                        // GitHub CLI binary
  args: [
    'copilot',                          // gh subcommand
    prompt,
  ],
  env: { GITHUB_TOKEN: token },
  usePty: false,
}
```

**Important:** The `cliCommand` property is `'copilot'` (the logical agent name), but `SpawnArgs.command` is `'gh'` because Copilot CLI is installed as a GitHub CLI extension. The adapter's `detectVersion()` runs `gh copilot --version`, not `copilot --version`.

### 5.3 Event Parsing

**Native format:** Plain text streaming with JSON session metadata. Simpler parsing than most agents — primarily produces `text_delta` events.

**Parsing strategy:** Lines are checked for JSON structure first (session metadata). Non-JSON lines are treated as text output and emitted as `text_delta` events. Session metadata JSON objects (identified by having a `session_id` field) are consumed internally and not emitted.

**Native output → AgentEvent mappings:**

| Native output pattern | AgentEvent type(s) |
|---|---|
| First text line received | `message_start` (synthetic) |
| Non-JSON text line | `text_delta` |
| JSON metadata with `session_id` | (consumed internally, not emitted) |
| Process exit code 0 | `message_stop` (synthetic) |
| Process exit code non-zero | `crash` |

**Auth/error detection:** Since Copilot produces plain text, auth failures are detected by pattern-matching stderr and stdout for known error strings (e.g., "not authenticated", "requires authentication"). These are translated to `auth_error` events.

**Key limitations:**
- No `tool_call_start` / `tool_result` / `tool_input_delta` events (`supportsNativeTools: false`).
- No `thinking_start` / `thinking_delta` / `thinking_stop` events (`supportsThinking: false`).
- No `mcp_tool_call_start` events (`supportsMCP: false`).
- No `session_resume` / `session_fork` events (`canResume: false`, `canFork: false`).

### 5.4 Session Format

- **Location:** `~/.config/github-copilot/sessions/`
- **Format:** JSON.
- **Capabilities:** `canResume: false`, `canFork: false`, `sessionPersistence: 'file'`.

### 5.5 Thinking Normalization

Not applicable. `supportsThinking: false`. Setting `thinkingEffort` throws `CapabilityError`.

### 5.6 Install Methods

| Platform | Type | Command | Notes |
|---|---|---|---|
| all | gh-extension | `gh extension install github/gh-copilot` | Requires GitHub CLI |

**Prerequisite:** `gh --version` must succeed. Install GitHub CLI with `brew install gh` (macOS), `apt install gh` (Debian/Ubuntu), or `winget install GitHub.cli` (Windows).

### 5.7 Auth Detection

- **Primary:** `oauth_device` — checks OAuth token cache in `~/.config/github-copilot/hosts.json`.
- **Alternative:** `github_token` — checks `GITHUB_TOKEN` environment variable.

### 5.8 Plugin Support

- **`supportsPlugins`:** `false`.
- All plugin operations throw `CapabilityError`.

---

## 6. Gemini CLI Adapter

### 6.1 Identity

| Property | Value |
|---|---|
| `agent` | `'gemini'` |
| `displayName` | `'Gemini CLI'` |
| `cliCommand` | `'gemini'` |
| `minVersion` | `'1.0.0'` |

### 6.2 buildSpawnArgs

```typescript
SpawnArgs {
  command: 'gemini',
  args: [
    prompt,
    '--model', modelId,
  ],
  env: { GOOGLE_API_KEY: apiKey },
  usePty: false,
}
```

**MCP servers:** Configured via the Gemini config file, not CLI args. The adapter writes MCP server definitions to `~/.config/gemini/settings.json` before spawn.

### 6.3 Event Parsing

**Native format:** JSONL streaming output. Google-specific event shapes translated to AgentEvent.

**Key native event types and their AgentEvent mappings:**

| Native type | AgentEvent type(s) |
|---|---|
| `generateContent.start` | `message_start` |
| `generateContent.text` | `text_delta` |
| `generateContent.thought.start` | `thinking_start` |
| `generateContent.thought` | `thinking_delta` |
| `generateContent.thought.done` | `thinking_stop` |
| `generateContent.functionCall` | `tool_call_start` |
| `generateContent.functionCall.delta` | `tool_input_delta` (when streaming tool input) |
| `generateContent.functionCall.done` | `tool_call_ready` |
| `generateContent.functionResponse` | `tool_result` |
| `generateContent.image` | `image_output` |
| `generateContent.done` | `message_stop` |
| `usage` | `cost` (token usage extraction) |

**Unique capability:** `supportsImageOutput: true` — Gemini is the only built-in agent that produces `image_output` events. The adapter parses base64-encoded image data from the native output.

### 6.4 Session Format

- **Location:** `~/.gemini/sessions/`
- **Format:** JSONL.
- **Capabilities:** `canResume: false`, `canFork: false`, `sessionPersistence: 'file'`.

> **Note:** Spec 06 §12.3 confirms `canResume=false, canFork=false` for Gemini CLI.

### 6.5 Thinking Normalization

| Effort | Mapping | CLI mechanism |
|---|---|---|
| `'low'` | `thinkingConfig.thinkingBudget: 1024` | `--thinking-budget 1024` |
| `'medium'` | `thinkingConfig.thinkingBudget: 8192` | `--thinking-budget 8192` |
| `'high'` | `thinkingConfig.thinkingBudget: 32768` | `--thinking-budget 32768` |
| `'max'` | `thinkingConfig.thinkingBudget: max` | `--thinking-budget max` |

Maps to Gemini's `thinkingConfig` equivalents. The `--thinking-budget` CLI flag is passed in the `args` array of `SpawnArgs` when `thinkingEffort` is set.

### 6.6 Install Methods

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @google/gemini-cli` |

### 6.7 Auth Detection

- **Primary:** `browser_login` and `api_key` (both equally primary per spec 08 §10.1) — checks `GOOGLE_API_KEY` and `GEMINI_API_KEY` environment variables; also checks browser-based login session at `~/.config/gemini/credentials.json`.
- No alternative methods. Spec 06 §12.3 lists `methods=['api-key','oauth']`; the `oauth` method is the same credential mechanism as `browser_login` (browser-based OAuth flow producing a cached credential file).

### 6.8 Plugin Support

- **`supportsPlugins`:** `false`.
- All plugin operations throw `CapabilityError`.

---

## 7. Cursor Adapter

### 7.1 Identity

| Property | Value |
|---|---|
| `agent` | `'cursor'` |
| `displayName` | `'Cursor'` |
| `cliCommand` | `'cursor'` |
| `minVersion` | `'0.45.0'` |

### 7.2 buildSpawnArgs

```typescript
SpawnArgs {
  command: 'cursor',
  args: [
    prompt,
    '--model', modelId,
  ],
  env: {},  // Auth via session token, not env var
  usePty: false,
}
```

> **Cross-spec reconciliation:** `06-capabilities-and-models.md` §12.5 lists `requiresPty=true` for Cursor, which is incorrect. The correct value is `false`. Evidence: (1) Scope §22 explicitly names only "OpenClaw" as requiring PTY ("PTY support via node-pty for agents that require it (OpenClaw, some interactive modes)"). (2) `11-process-lifecycle-and-platform.md` §6.1 lists only OpenClaw in the PTY-required agents table. (3) `03-run-handle-and-interaction.md` §7.1 confirms Cursor's `usePty=false`. The `requiresPty` values for Cursor and OpenClaw are swapped in spec 06 (see also §11.9).

### 7.3 Event Parsing

**Native format:** Partial streaming — text events are streamed, but tool call results may be buffered. The adapter handles both streaming and buffered output.

**Key native event types and their AgentEvent mappings:**

| Native output pattern | AgentEvent type(s) |
|---|---|
| Stream start marker | `message_start` |
| Text chunk | `text_delta` |
| Tool invocation (buffered JSON) | `tool_call_start`, `tool_call_ready` |
| Tool output (buffered JSON) | `tool_result` |
| Completion marker | `message_stop` |
| Non-zero exit / error JSON | `crash` or `error` |

**Note:** Cursor's output format is partially documented. The adapter's `parseEvent()` handles both streaming text lines and buffered JSON blocks for tool calls. Thinking events are model-dependent: emitted only when `ModelCapabilities.supportsThinking` is true for the selected model.

### 7.4 Session Format

- **Location:** `~/.cursor/sessions/`
- **Format:** SQLite.
- **Capabilities:** `canResume: false`, `canFork: false`, `sessionPersistence: 'sqlite'`.

### 7.5 Thinking Normalization

Model-dependent. When the selected model's `ModelCapabilities.supportsThinking` is `true`, thinking effort is passed as a provider-level parameter. When `false`, setting `thinkingEffort` throws `CapabilityError`.

### 7.6 Install Methods

| Platform | Type | Command | Notes |
|---|---|---|---|
| darwin | manual | `open https://cursor.sh/download` | macOS .dmg installer |
| linux | manual | `open https://cursor.sh/download` | AppImage |
| win32 | winget | `winget install Cursor.Cursor` | |

**Note:** No headless-only install. Full app required even for CLI use.

### 7.7 Auth Detection

- **Primary:** `browser_login` — inspects session token in `~/.cursor/auth.json` (per spec 08 §10.1).
- **Alternative:** `api_key` — checks `CURSOR_API_KEY` environment variable.

> **Cross-spec reconciliation:** Spec 06 §12.5 lists auth methods as `['oauth']` while spec 08 §10.1 lists primary method as `browser_login`. This spec follows spec 08 as the authoritative source for auth detection strategies. The distinction is behavioral: `browser_login` describes how the user authenticates (via Cursor's built-in browser flow), while the token format stored in `auth.json` is an OAuth token.

### 7.8 Plugin Support

- **`supportsPlugins`:** `true`.
- **Formats:** `['extension-ts', 'mcp-server']`.
- **Registry:** `{ name: 'cursor-extensions', url: 'https://cursor.sh/extensions', searchable: true }`.
- Cursor uses its own extension system for TypeScript extensions.

---

## 8. OpenCode Adapter

### 8.1 Identity

| Property | Value |
|---|---|
| `agent` | `'opencode'` |
| `displayName` | `'OpenCode'` |
| `cliCommand` | `'opencode'` |
| `minVersion` | `'1.0.0'` |

### 8.2 buildSpawnArgs

```typescript
SpawnArgs {
  command: 'opencode',
  args: [
    prompt,
    '--model', modelId,
    '--session', sessionId,
    '--fork', forkSessionId,
  ],
  env: { /* provider-specific: ANTHROPIC_API_KEY or OPENAI_API_KEY */ },
  usePty: false,
}
```

### 8.3 Event Parsing

**Native format:** Structured JSON streaming. Full tool call streaming. ACP event types also emitted.

**Key native event types and their AgentEvent mappings:**

| Native type | AgentEvent type(s) |
|---|---|
| `message.start` | `message_start` |
| `message.text.delta` | `text_delta` |
| `message.thinking.start` | `thinking_start` (when model supports thinking) |
| `message.thinking.delta` | `thinking_delta` (when model supports thinking) |
| `message.thinking.done` | `thinking_stop` (when model supports thinking) |
| `tool.call` | `tool_call_start` |
| `tool.call.delta` | `tool_input_delta` |
| `tool.call.done` | `tool_call_ready` |
| `tool.result` | `tool_result` |
| `mcp.tool.call` | `mcp_tool_call_start` |
| `mcp.tool.result` | `mcp_tool_result` |
| `message.complete` | `message_stop` |

**ACP events:** OpenCode emits native ACP protocol events (`acp.request`, `acp.response`) that are not part of the AgentEvent union (spec 04). These are translated to `debug` events with `{ type: 'debug', message: JSON.stringify(nativeEvent) }`, preserving ACP data without extending the event union.

**Unique capability:** `supportsStructuredOutput: true` — OpenCode is the only built-in agent supporting structured output. When structured output is requested, the agent's final text output (in the last `text_delta` events before `message_stop`) contains the JSON-formatted structured response conforming to the user-specified schema. The adapter does not introduce new event types; consumers parse the accumulated text from `text_delta` events.

**Session lifecycle events:** When resuming (`--session`), the adapter emits `session_resume`. When forking (`--fork`), it emits `session_fork`. These are synthesized by the adapter from session metadata.

### 8.4 Session Format

- **Location:** `~/.local/share/opencode/` (XDG data home on Linux; platform-appropriate on macOS/Windows).
- **Format:** SQLite.
- **Capabilities:** `canResume: true`, `canFork: true`, `sessionPersistence: 'sqlite'`.

### 8.5 Thinking Normalization

Model-dependent. Passed as provider-level parameter when model supports thinking.

### 8.6 Install Methods

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g opencode` |
| darwin | brew | `brew install opencode/tap/opencode` |

### 8.7 Auth Detection

- **Primary:** `api_key` — checks provider-specific env vars (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) based on configured provider.
- **Auth file:** `~/.config/opencode/auth.json`.

### 8.8 Plugin Support

- **`supportsPlugins`:** `true`.
- **Formats:** `['npm-package', 'skill-file', 'mcp-server']`.
- **Registry:** `{ name: 'npm', url: 'https://www.npmjs.com/search?q=opencode-', searchable: true }`.
- **Marketplace:** `https://www.npmjs.com/search?q=opencode-`.

---

## 8.b OpenCode HTTP Adapter

### 8.b.1 Identity

| Property | Value |
|---|---|
| `agent` | `'opencode-http'` |
| `displayName` | `'OpenCode (HTTP)'` |
| `adapterType` | `'remote'` |
| `connectionType` | `'http'` |
| `minVersion` | `'0.1.0'` |

**Note**: This is a **remote adapter** (not subprocess), implementing the `RemoteAdapter` interface.

### 8.b.2 Connection Management

```typescript
// HTTP connection via RemoteAdapter interface
interface OpenCodeHttpConnection {
  connectionType: 'http';
  baseUrl: string;          // e.g., 'http://localhost:9527'
  
  // Server-Sent Events streaming
  stream(path: string, data: unknown): AsyncIterableIterator<AgentEvent>;
  
  // REST API methods
  get(path: string, params?: Record<string, unknown>): Promise<unknown>;
  post(path: string, data?: unknown): Promise<unknown>;
}
```

**Server management**: The adapter automatically starts `opencode serve --port 0` when needed and manages the server lifecycle.

### 8.b.3 Event Parsing

**Transport:** HTTP POST to `/api/chat/stream` with Server-Sent Events (SSE).

**Event format:** SSE events are parsed from `data: {...}` lines, with JSON payloads matching OpenCode's native event structure.

| SSE Event Type | AgentEvent type(s) |
|---|---|
| `message.start` | `message_start` |
| `message.text.delta` | `text_delta` |
| `tool_start`, `tool_call` | `tool_call_start` |
| `tool_input` | `tool_input_delta` |
| `tool_ready` | `tool_call_ready` |
| `tool_result` | `tool_result` |
| `message.stop` | `message_stop` |

**Enhanced streaming**: SSE provides lower latency than subprocess stdout parsing.

### 8.b.4 Session Format

- **Location:** Same as subprocess OpenCode: `~/.local/share/opencode/` (XDG data home on Linux).
- **Format:** SQLite (shared with subprocess adapter).
- **Capabilities:** `canResume: true`, `canFork: true`, `sessionPersistence: 'sqlite'`.

### 8.b.5 Server Lifecycle

- **Startup**: `opencode serve --port 0 --host 127.0.0.1` with dynamic port allocation.
- **Health monitoring**: Regular `/health` endpoint checks.
- **Cleanup**: Graceful server shutdown on adapter disposal.
- **Port management**: Automatic port discovery to avoid conflicts.

### 8.b.6 Auth Detection

- **Inherited**: Uses same auth detection as subprocess OpenCode adapter.
- **Provider support**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`.
- **Config file**: `~/.config/opencode/config.json`.

### 8.b.7 Plugin Support

- **Identical to subprocess adapter**: Supports MCP servers via HTTP API.
- **Formats:** `['mcp-server']`.
- **Registry:** MCP server marketplace at https://modelcontextprotocol.io.

**Advantage**: HTTP interface enables enhanced MCP plugin management compared to subprocess limitations.

---

## 10. Pi Adapter

### 9.1 Identity

| Property | Value |
|---|---|
| `agent` | `'pi'` |
| `displayName` | `'Pi'` |
| `cliCommand` | `'pi'` |
| `minVersion` | `'1.0.0'` |

### 9.2 buildSpawnArgs

```typescript
SpawnArgs {
  command: 'pi',
  args: [
    prompt,
    '--model', modelId,
    '--session', sessionId,
    '--fork', forkSessionId,
  ],
  env: { /* provider-specific */ },
  usePty: false,
}
```

### 9.3 Event Parsing

**Native format:** JSONL streaming. Each line is a JSON object with `id`, `parentId`, `type`, and `data` fields.

**Live event parsing vs. session parsing:** During a live run, the adapter processes each JSONL line as it arrives. The `id` and `parentId` fields are used for session reconstruction (§9.4) but are not needed for real-time event emission. The `type` field determines the AgentEvent mapping:

| Native `type` field | AgentEvent type(s) |
|---|---|
| `message_start` | `message_start` |
| `text` | `text_delta` |
| `thinking_start` | `thinking_start` (when model supports thinking) |
| `thinking` | `thinking_delta` (when model supports thinking) |
| `thinking_end` | `thinking_stop` (when model supports thinking) |
| `tool_call` | `tool_call_start` |
| `tool_call_input` | `tool_input_delta` (when streaming tool input) |
| `tool_call_ready` | `tool_call_ready` |
| `tool_result` | `tool_result` |
| `message_end` | `message_stop` |
| `error` | `error` |

**Session lifecycle events:** When resuming (`--session`), the adapter emits `session_resume`. When forking (`--fork`), it emits `session_fork`. These are synthesized by the adapter from session metadata.

### 9.4 Session Format

- **Location:** `~/.pi/agent/sessions/`
- **Format:** JSONL tree (each entry has `id` and `parentId` fields forming a conversation tree).
- **Capabilities:** `canResume: true`, `canFork: true`, `sessionPersistence: 'file'`.

**Tree reconstruction:** The session parser must reconstruct the conversation tree from `id`/`parentId` references rather than treating entries as a flat list. A given session file may contain multiple conversation branches.

### 9.5 Thinking Normalization

Model-dependent. Passed as provider-level parameter when model supports thinking.

### 9.6 Install Methods

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @earendil-works/pi-coding-agent` |

### 9.7 Auth Detection

- **Primary:** `api_key` — checks provider-specific env vars based on configured provider.
- **Auth file:** `~/.pi/agent/auth.json`.

### 9.8 Plugin Support

- **`supportsPlugins`:** `true`.
- **Formats:** `['npm-package', 'skill-file']`.
- **Registry:** `{ name: 'npm', url: 'https://www.npmjs.com/search?q=%40mariozechner%2Fpi-', searchable: true }`.

---

## 11. omp Adapter

### 10.1 Identity

| Property | Value |
|---|---|
| `agent` | `'omp'` |
| `displayName` | `'omp (oh-my-pi)'` |
| `cliCommand` | `'omp'` |
| `minVersion` | `'1.0.0'` |

### 10.2 buildSpawnArgs

```typescript
SpawnArgs {
  command: 'omp',
  args: [
    prompt,
    '--model', modelId,
    '--session', sessionId,
    '--fork', forkSessionId,
  ],
  env: { /* provider-specific */ },
  usePty: false,
}
```

### 10.3 Event Parsing

**Native format:** JSONL tree (identical format to Pi). Same `id`/`parentId` tree structure. Same native event type → AgentEvent mappings as Pi (§9.3), including `tool_input_delta` and session lifecycle events.

**Key difference from Pi:** omp unconditionally emits `thinking_start`, `thinking_delta`, and `thinking_stop` events regardless of model, since omp always supports thinking (§10.5).

### 10.4 Session Format

- **Location:** `~/.omp/agent/sessions/`
- **Format:** JSONL tree (identical to Pi — same `id`/`parentId` structure).
- **Capabilities:** `canResume: true`, `canFork: true`, `sessionPersistence: 'file'`.

### 10.5 Thinking Normalization

**Always supported** (not model-dependent, unlike Pi):

| Effort | Mapping |
|---|---|
| `'low'` | `budget_tokens: 1024` |
| `'medium'` | `budget_tokens: 8192` |
| `'high'` | `budget_tokens: 32768` |
| `'max'` | `budget_tokens: max_budget_tokens` |

**Key difference from Pi:** omp unconditionally supports all thinking effort levels. Setting `thinkingEffort` never throws `CapabilityError` for omp, regardless of model.

### 10.6 Install Methods

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @oh-my-pi/pi-coding-agent` |

### 10.7 Auth Detection

- Same approach as Pi: provider-specific env var inspection.
- **Auth file:** `~/.omp/agent/auth.json`.

### 10.8 Plugin Support

- **`supportsPlugins`:** `true`.
- **Formats:** `['npm-package', 'skill-file']`.
- **Registry:** `{ name: 'npm', url: 'https://www.npmjs.com/search?q=%40oh-my-pi%2F', searchable: true }`.

### 10.9 Platform Notes

- **Windows:** Partial support. Core run/prompt functionality works. Some shell-dependent tool operations may behave differently under `cmd.exe`. The adapter emits a `debug` event with `level: 'warn'` on Windows.
- **`supportedPlatforms`:** `['darwin', 'linux', 'win32']`.
- See `11-process-lifecycle-and-platform.md` §5.2 for full details.

---

## 12. OpenClaw Adapter

### 11.1 Identity

| Property | Value |
|---|---|
| `agent` | `'openclaw'` |
| `displayName` | `'OpenClaw'` |
| `cliCommand` | `'openclaw'` |
| `minVersion` | `'1.0.0'` |

### 11.2 buildSpawnArgs

```typescript
SpawnArgs {
  command: 'openclaw',
  args: [
    prompt,
    '--model', modelId,
  ],
  env: { OPENCLAW_API_KEY: apiKey },
  usePty: true,                       // Requires PTY
}
```

### 11.3 Event Parsing

**Native format:** Interactive TUI output via PTY. Requires VT escape sequence stripping (`VtStripper`, spec 11 §6.3) before line-based parsing. After stripping, output lines are JSON objects.

**Parsing pipeline:** Raw PTY output → `VtStripper.strip()` → JSON.parse per line → native type → AgentEvent.

**Key native event types and their AgentEvent mappings (after VT stripping):**

| Native JSON `type` field | AgentEvent type(s) |
|---|---|
| `response.start` | `message_start` |
| `response.text` | `text_delta` |
| `response.thinking.start` | `thinking_start` (model-dependent) |
| `response.thinking` | `thinking_delta` (model-dependent) |
| `response.thinking.end` | `thinking_stop` (model-dependent) |
| `tool.invoke` | `tool_call_start` |
| `tool.invoke.delta` | `tool_input_delta` |
| `tool.invoke.done` | `tool_call_ready` |
| `tool.output` | `tool_result` |
| `channel.event` | `plugin_invoked` (channel-plugin activity) |
| `plugin.loaded` | `plugin_loaded` |
| `response.end` | `message_stop` |
| `error` | `error` |

**Session lifecycle:** OpenClaw has `canResume: false`, `canFork: false`, so `session_resume` and `session_fork` events are never emitted.

**Channel-plugin events:** Native channel-plugin activity (messages from Telegram, Discord, Slack, etc.) is identified by the `channel.event` type and translated to `plugin_invoked` AgentEvents. The `plugin_loaded` event fires when a channel-plugin successfully connects to its messaging platform.

**Partial streaming:** Text events are streamed in real-time, but tool results may be buffered until the tool completes.

### 11.4 Session Format

- **Location:** `~/.openclaw/sessions/`
- **Format:** JSON (per channel/session).
- **Capabilities:** `canResume: false`, `canFork: false`, `sessionPersistence: 'file'`.

### 11.5 Thinking Normalization

Model-dependent. Passed as provider-level parameter when model supports thinking.

### 11.6 Install Methods

| Platform | Type | Command | Notes |
|---|---|---|---|
| all | npm | `npm install -g openclaw` | Requires Node 22.16+, 16GB RAM minimum |

### 11.7 Auth Detection

- **Primary:** `api_key` — checks provider-specific env vars.
- **Auth file:** `~/.openclaw/auth.json`.

### 11.8 Plugin Support

- **`supportsPlugins`:** `true`.
- **Formats:** `['npm-package', 'skill-file', 'channel-plugin']`.
- **Registries:** `[{ name: 'npm', searchable: true }, { name: 'openclaw-registry', url: 'https://openclaw.ai/plugins', searchable: true }]`.
- **Unique format:** `channel-plugin` for messaging gateways (Telegram, Discord, Slack, WhatsApp, Signal).

### 11.9 PTY Requirement

OpenClaw is the only built-in agent with `requiresPty: true` (scope §22). See `11-process-lifecycle-and-platform.md` §6 for PTY details.

> **Cross-spec reconciliation:** `06-capabilities-and-models.md` §12.9 incorrectly lists `requiresPty=false` for OpenClaw. The correct value is `true`, per scope §22 ("PTY support via node-pty for agents that require it (OpenClaw, some interactive modes)"), `03-run-handle-and-interaction.md` §7.1, and `11-process-lifecycle-and-platform.md` §6.1.

### 11.10 Platform Notes

- **Windows:** Requires ConPTY (Windows 10 1809+). Older Windows versions fall back to winpty with potential output buffering differences.

---

## 13. Hermes Adapter

> **SCOPE EXTENSION:** hermes-agent (`@NousResearch/hermes-agent`) is included as a 10th supported agent.

### 12.1 Identity

| Property | Value |
|---|---|
| `agent` | `'hermes'` |
| `displayName` | `'hermes-agent'` |
| `cliCommand` | `'hermes'` |
| `minVersion` | `'0.1.0'` |

### 12.2 buildSpawnArgs

```typescript
SpawnArgs {
  command: 'hermes',
  args: [
    prompt,
    '--output-format', 'jsonl',        // Required for structured output
    '--model', modelId,                // Model selection (multi-provider)
    '--session', sessionId,            // Resume session (canResume=true)
  ],
  env: {
    // Multi-provider: set whichever key is configured
    OPENROUTER_API_KEY: ...,
    NOUS_API_KEY: ...,
    ANTHROPIC_API_KEY: ...,
    OPENAI_API_KEY: ...,
    GITHUB_TOKEN: ...,
    GOOGLE_API_KEY: ...,
  },
  usePty: false,
}
```

**Critical:** The `--output-format jsonl` flag must always be passed. Without it, hermes produces human-readable text that cannot be parsed by `parseEvent()`.

### 12.3 Event Parsing

**Native format:** JSONL via `--output-format jsonl`. Python process emits structured events.

**Key native event types and their AgentEvent mappings:**

| Native `type` field | AgentEvent type(s) |
|---|---|
| `message_start` | `message_start` |
| `text_delta` | `text_delta` |
| `tool_call` | `tool_call_start` |
| `tool_call_input` | `tool_input_delta` |
| `tool_call_ready` | `tool_call_ready` |
| `tool_result` | `tool_result` |
| `mcp_tool_call` | `mcp_tool_call_start` |
| `mcp_tool_result` | `mcp_tool_result` |
| `skill_loaded` | `skill_loaded` (maps to `SkillLoadedEvent`, not `PluginLoadedEvent`) |
| `skill_invoked` | `skill_invoked` (maps to `SkillInvokedEvent`, not `PluginInvokedEvent`) |
| `message_end` | `message_stop` |
| `usage` | `cost` |
| `error` | `error` |

**Skill events:** hermes skills are mapped to the `skill_loaded` / `skill_invoked` AgentEvent types (spec 04), not to `plugin_loaded` / `plugin_invoked`, because hermes's skill system matches the skill event semantics (name + source) rather than the plugin event semantics (pluginId + version).

**MCP events:** MCP tool events (`mcp_tool_call_start`, `mcp_tool_result`) are emitted when hermes invokes tools from connected MCP servers.

**Session lifecycle:** hermes has `canResume: true`, `canFork: false`. The adapter synthesizes `session_resume` when invoked with `--session`. No `session_fork` events.

**Thinking:** hermes has `supportsThinking: false`, so `thinking_start`, `thinking_delta`, and `thinking_stop` events are never emitted.

### 12.4 Session Format

- **Location:** `~/.hermes/` (SQLite database).
- **Format:** SQLite with FTS5 full-text search support.
- **Capabilities:** `canResume: true`, `canFork: false`, `sessionPersistence: 'sqlite'`.

> **SCOPE EXTENSION:** hermes session location and SQLite format are not in the original scope's session table (scope §16). This is a spec-level extension derived from hermes-agent's actual behavior.

### 12.5 Thinking Normalization

Not applicable. `supportsThinking: false`. Setting `thinkingEffort` throws `CapabilityError`.

### 12.6 Install Methods

| Platform | Type | Command | Notes |
|---|---|---|---|
| all | pip | `pip install hermes-agent` | Requires Python >= 3.11 |
| all | curl | `curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh \| bash` | Shell installer; requires Unix shell (bash). On Windows, use WSL2 or Git Bash. |
| all | nix | `nix run github:NousResearch/hermes-agent` | Nix flake available |

> **SCOPE EXTENSION:** hermes install methods are Python-based (pip), unlike all other agents which use npm or platform-specific methods. The `'pip'` and `'nix'` install types are already incorporated into the `InstallMethod.type` union in spec 06 §3.3.

### 12.7 Auth Detection

- **Primary:** `api_key` (per spec 08 §10.1) — checks environment variables in priority order: `OPENROUTER_API_KEY`, `NOUS_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GITHUB_TOKEN`, `GOOGLE_API_KEY`.
- **Alternative:** `oauth` — checks OAuth token cache from `hermes login` (Nous Portal or OpenAI Codex).
- **Alternative:** `github_token` — checks `GITHUB_TOKEN` for GitHub-backed model access.
- **Alternative:** `config_file` — inspects `~/.hermes/cli-config.yaml` for embedded API keys (YAML safe-load only).
- Returns `'authenticated'` if any valid credential is found for any provider.
- `AuthState.details` lists all detected providers with their auth method.

> **SCOPE EXTENSION:** hermes-agent supports the broadest set of auth methods (6+ env vars, YAML config, OAuth) reflecting its multi-provider architecture.

### 12.8 Plugin Support

- **`supportsPlugins`:** `true`.
- **Formats:** `['skill-file', 'skill-directory', 'mcp-server']`.
- **Registry:** `{ name: 'agentskills-hub', url: 'https://agentskills.io', searchable: true }`.
- **MCP:** Supports both MCP client (connecting to external MCP servers) and MCP server (exposing hermes capabilities via `mcp_serve.py`).
- **Note:** hermes MCP server plugins have no registry discovery path — they are configured directly via `~/.hermes/cli-config.yaml`. See `09-plugin-manager.md` for details.

### 12.9 Platform Notes

- **macOS / Linux:** Fully supported.
- **Windows:** WSL2 only. Native Windows is not supported. See `11-process-lifecycle-and-platform.md` §5.3.
- **`supportedPlatforms`:** `['darwin', 'linux']` — does not include `'win32'`.
- **Python dependency:** hermes is the only Python-based agent. It requires Python >= 3.11 on PATH. Virtual environment installations must ensure `hermes` is accessible on PATH.

---

## 14. Per-Adapter Thinking Effort Summary

| Agent | `'low'` | `'medium'` | `'high'` | `'max'` | Budget tokens | Notes |
|---|---|---|---|---|---|---|
| claude | 1024 | 8192 | 32768 | max_budget_tokens | Passed through | `--thinking-budget` flag |
| codex | `'low'` | `'medium'` | `'high'` | `'high'` | Ignored | `--reasoning` flag; max→high |
| gemini | 1024 | 8192 | 32768 | max | Via thinkingConfig | thinkingConfig equivalents |
| copilot | — | — | — | — | — | `supportsThinking: false` |
| cursor | model-dep | model-dep | model-dep | model-dep | model-dep | Provider-level param |
| opencode | model-dep | model-dep | model-dep | model-dep | model-dep | Provider-level param |
| pi | model-dep | model-dep | model-dep | model-dep | model-dep | Provider-level param |
| omp | 1024 | 8192 | 32768 | max_budget_tokens | Passed through | Always supported |
| openclaw | model-dep | model-dep | model-dep | model-dep | model-dep | Provider-level param |
| hermes | — | — | — | — | — | `supportsThinking: false` |

**Cross-reference:** Full thinking normalization tables are in `06-capabilities-and-models.md` §8.

---

## 15. Per-Adapter Auth Summary

| Agent | Primary method | Env var(s) | Auth file |
|---|---|---|---|
| claude | `browser_login` | `ANTHROPIC_API_KEY` | `~/.claude/` (session tokens) |
| codex | `api_key` | `OPENAI_API_KEY` | `~/.codex/auth.json` |
| gemini | `browser_login` / `api_key` | `GOOGLE_API_KEY`, `GEMINI_API_KEY` | `~/.config/gemini/credentials.json` |
| copilot | `oauth_device` | `GITHUB_TOKEN` | `~/.config/github-copilot/hosts.json` |
| cursor | `browser_login` | `CURSOR_API_KEY` (fallback) | `~/.cursor/auth.json` |
| opencode | `api_key` | Provider-specific | `~/.config/opencode/auth.json` |
| pi | `api_key` | Provider-specific | `~/.pi/agent/auth.json` |
| omp | `api_key` | Provider-specific | `~/.omp/agent/auth.json` |
| openclaw | `api_key` | Provider-specific | `~/.openclaw/auth.json` |
| hermes | Multi (6+ methods) | 6+ env vars | `~/.hermes/.env`, `~/.hermes/cli-config.yaml` |

**Cross-reference:** Full auth detection strategies are in `08-config-and-auth.md` §10.1.

**Invariant:** All auth detection is read-only, local-only, no network calls, completes under 100ms.

---

## 16. Per-Adapter Plugin Support Summary

| Agent | `supportsPlugins` | Formats | Registry | Marketplace |
|---|---|---|---|---|
| claude | `true` (partial) | skill-directory, mcp-server | — | — |
| codex | `false` | — | — | — |
| gemini | `false` | — | — | — |
| copilot | `false` | — | — | — |
| cursor | `true` | extension-ts, mcp-server | cursor-extensions | `https://cursor.sh/extensions` |
| opencode | `true` | npm-package, skill-file, mcp-server | npm | `https://www.npmjs.com/search?q=opencode-` |
| pi | `true` | npm-package, skill-file | npm | `https://www.npmjs.com/search?q=%40mariozechner%2Fpi-` |
| omp | `true` | npm-package, skill-file | npm | `https://www.npmjs.com/search?q=%40oh-my-pi%2F` |
| openclaw | `true` | npm-package, skill-file, channel-plugin | npm + openclaw-registry | `https://openclaw.ai/plugins` |
| hermes | `true` | skill-file, skill-directory, mcp-server | agentskills-hub | `https://agentskills.io` |

**Cross-reference:** Full plugin support matrix in `06-capabilities-and-models.md` §9 and `09-plugin-manager.md`.

---

## 17. Error Format Translation

All adapters translate native agent errors into typed `AgentEvent` objects. The `BaseAgentAdapter` class (spec 05 §4) provides hook methods for common error scenarios:

### 16.1 Error Event Mappings

| Native error type | AgentEvent `type` | Fields |
|---|---|---|
| Auth failure (invalid/missing key) | `auth_error` | `agent`, `message`, `guidance` |
| Rate limit / quota exceeded | `rate_limit_error` | `message`, `retryAfterMs` |
| Context window exceeded | `context_exceeded` | `usedTokens`, `maxTokens` |
| Process crash (non-zero exit) | `crash` | `exitCode`, `stderr` |
| Generic / unknown error | `error` | `code: ErrorCode`, `message`, `recoverable` |

### 16.2 parseEvent() Contract

- `parseEvent()` **must never throw**. Unrecognized lines return `null`.
- In debug mode (`ClientOptions.debug: true`, spec 01 §5.1.1), unrecognized lines are emitted as `{ type: 'log', source: 'stdout', line: rawLine }` (conforming to the `LogEvent` type defined in spec 04).
- Empty lines and whitespace-only lines are silently dropped.

### 16.3 BaseAgentAdapter Error Hooks

Per spec 05 §4 (canonical signatures):

| Hook | Signature | Trigger | Default behavior |
|---|---|---|---|
| `onSpawnError(error)` | `(error: Error) → AgentEvent` | Subprocess fails to start | Returns `{ type: 'crash', exitCode: -1, stderr: error.message }` |
| `onTimeout()` | `() → AgentEvent` | Run or inactivity timeout | Returns `{ type: 'error', code: 'TIMEOUT', recoverable: false }` |
| `onProcessExit(code, signal)` | `(exitCode: number, signal: string \| null) → AgentEvent[]` | Subprocess exits | Returns terminal events based on exit code/signal |
| `shouldRetry(event, attempt, policy)` | `(event: AgentEvent, attempt: number, policy: RetryPolicy) → boolean` | After error, before retry | Returns `false` (no retry by default) |

---

## 18. Version Detection

All adapters detect the installed agent version via `detectVersionFromCli()` (a `BaseAgentAdapter` utility):

```typescript
// Default: runs `<cliCommand> --version` and parses semver
const version = await detectVersionFromCli(adapter.cliCommand);
```

**Exceptions:**
- **Copilot:** Runs `gh copilot --version` (not `copilot --version`).
- **hermes:** Runs `hermes --version`; output is Python-formatted (e.g., `hermes-agent 0.1.0`).

The detected version is compared against `minVersion`. If the installed version is below `minVersion`, `AdapterRegistry.detect()` returns an `InstalledAgentInfo` with `meetsMinVersion: false` and `mux.run()` emits a `debug` warning.

---

## 19. Adapter Registration

All 10 built-in adapters are registered with the `AdapterRegistry` during `createClient()`:

```typescript
// Simplified registration sequence
const registry = new AdapterRegistry();
registry.register(new ClaudeCodeAdapter());
registry.register(new CodexAdapter());
registry.register(new GeminiAdapter());
registry.register(new CopilotAdapter());
registry.register(new CursorAdapter());
registry.register(new OpenCodeAdapter());
registry.register(new PiAdapter());
registry.register(new OmpAdapter());
registry.register(new OpenClawAdapter());
registry.register(new HermesAdapter());
```

Plugin adapters registered via `mux.adapters.register()` are added after built-in adapters and extend the `AgentName` union at runtime.

---

## 20. Spec-Level Additions

The following items are spec-level additions not explicitly stated in the scope:

| Addition | Section | Rationale |
|---|---|---|
| `minVersion` per adapter | §3–12 | Required for version compatibility checking |
| hermes `--output-format jsonl` requirement | §12.2 | Not stated in scope; discovered through research |
| hermes FTS5 session search | §12.4 | SQLite FTS5 support is hermes-specific |
| Claude session hash-based paths | §3.4 | Implementation detail not in scope |
| Codex `'max'` → `'high'` mapping | §4.5 | Scope says `'max'→'high'` but only in comment |
| `parseEvent()` never-throw contract | §16.2 | Implied by spec 05 but not explicit in scope |
| Debug-mode logging of unrecognized lines | §16.2 | Extension for adapter debugging |
| Copilot `gh` vs `copilot` command split | §5.2 | Scope lists `copilot` as CLI but actual binary is `gh` |
| OpenClaw PTY reconciliation note | §11.9 | Corrects spec 06 cross-spec error |
| Cursor PTY reconciliation note | §7.2 | Corrects spec 06 cross-spec error (swapped with OpenClaw) |
| Auth method reconciliation notes | §3.7, §7.7 | Resolves spec 06 vs spec 08 auth method naming discrepancies |
| Per-adapter event mapping tables | §3–12 | Scope describes formats, not specific native event types |
| Session lifecycle event synthesis | §3–12 | Adapters synthesize session_resume/session_fork from metadata |
| hermes nix install method | §12.6 | From spec 06 §7.10; extends scope's install union |
| Prompt delivery via stdin | §3.2 | Implementation detail for long/array prompts |
| OpenCode ACP events as debug | §8.3 | ACP events not in AgentEvent union; translated to debug |

---

## Implementation Status (2026-04-12)

### Per-adapter session directories

Verified from each adapter's `sessionDir()`:

| Agent | Session directory |
|---|---|
| `claude` | `~/.claude/projects` |
| `codex` | `~/.codex/sessions` |
| `gemini` | `~/.gemini/sessions` |
| `copilot` | `~/.config/github-copilot/sessions` |
| `cursor` | `~/.cursor/sessions` |
| `opencode` | `~/.local/share/opencode` |
| `pi` | `~/.pi/agent/sessions` |
| `omp` | `~/.omp/agent/sessions` |
| `openclaw` | `~/.openclaw/sessions` |
| `hermes` | `~/.hermes/sessions` |
| `agent-mux-remote` | (none — transport-delegated) |

All adapters use `listJsonlFiles()` from `packages/adapters/src/session-fs.ts` to enumerate session files; writes route through the tmp + `fs.rename` atomic helper in the same module.

### 13. `agent-mux-remote` (11th built-in adapter)

`AgentMuxRemoteAdapter` (`packages/adapters/src/agent-mux-remote-adapter.ts`) is a pass-through adapter that emits plain `amux run …` spawn args. Transport is *out of scope* for the adapter: the caller wraps the returned `SpawnArgs` with a `RunOptions.invocation` of `'local'`, `'docker'`, `'ssh'`, or `'k8s'` via `buildInvocationCommand()`. This lets agent-mux **nest**: a local amux can dispatch to a second amux executing in a Docker container, on a remote SSH host, or in a Kubernetes pod.

Key fields:

| Field | Value |
|---|---|
| `agent` | `'agent-mux-remote'` |
| `displayName` | `agent-mux (remote via invocation mode)` |
| `cliCommand` | `amux` |
| `hostEnvSignals` | `[]` |
| `sessionDir()` | throws (delegated; the remote amux owns sessions) |
| Auth | `{ type: 'api_key', name: 'Transport' }` — handled by the chosen invocation mode. |

Runtime configuration is supplied via `RunOptions.env`:

- `AMUX_REMOTE_AGENT` — the harness to invoke on the remote side (default `claude`).

Structured JSONL events produced by the nested `amux run` are passed through unchanged.
