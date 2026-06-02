# CLI Reference (`amux`)

**Specification v1.0** | `@a5c-ai/agent-mux-cli`

> **SCOPE EXTENSION:** hermes-agent (`@NousResearch/hermes-agent`) is included as a 10th supported agent per explicit project requirements from the project owner. It extends the original scope document's 9 built-in agents. All hermes-specific content in this spec is marked with this same scope extension note.

---

## 1. Overview

The `amux` binary is the CLI surface of the `@a5c-ai/agent-mux` project. It exposes every capability of the SDK -- running agents, inspecting adapters, managing sessions, configuring agents, handling authentication, working with plugins, and tracking costs -- through a single command-line interface.

The CLI and SDK are co-equal surfaces that share the same core layer and behave identically. Every CLI command maps to a specific SDK method. This specification defines the CLI completely and precisely: a developer should be able to implement the binary from this document alone.

### 1.1 Package Coordinates

| Field | Value |
|---|---|
| npm package | `@a5c-ai/agent-mux-cli` |
| Binary name | `amux` |
| Language | TypeScript, strict mode |
| Runtime | Node.js 20.9.0 or later |
| License | MIT |

The binary is installed as part of `@a5c-ai/agent-mux` (the convenience meta-package) or standalone via `@a5c-ai/agent-mux-cli`. It depends on `@a5c-ai/agent-mux-comm` and `@a5c-ai/agent-mux-adapters`.

```bash
# Via meta-package
npm install -g @a5c-ai/agent-mux

# Standalone CLI
npm install -g @a5c-ai/agent-mux-cli

# Zero-install
npx @a5c-ai/agent-mux
npx @a5c-ai/agent-mux run claude "hello"
```

### 1.2 Cross-References

| Concept | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `ErrorCode`, `AgentMuxError` | `01-core-types-and-client.md` | 3.1 |
| `CapabilityError` | `01-core-types-and-client.md` | 3.2 |
| `ValidationError` | `01-core-types-and-client.md` | 3.3 |
| Storage layout | `01-core-types-and-client.md` | 4 |
| `createClient()`, `ClientOptions` | `01-core-types-and-client.md` | 5 |
| `RunOptions` | `02-run-options-and-profiles.md` | 2 |
| `ProfileManager` | `02-run-options-and-profiles.md` | 10 |
| `RunHandle`, `RunResult` | `03-run-handle-and-interaction.md` | 2, 3 |
| `AgentEvent` union | `04-agent-events.md` | 2 |
| `AgentAdapter`, `BaseAgentAdapter` | `05-adapter-system.md` | 2 |
| `AgentCapabilities`, `ModelCapabilities` | `06-capabilities-and-models.md` | 2 |
| `SessionManager` | `07-session-manager.md` | 2 |
| `ConfigManager`, `AuthManager` | `08-config-and-auth.md` | 2, 8 |
| `PluginManager` | `09-plugin-manager.md` | 2 |
| CLI commands (scope) | `agent-mux-scope.md` | 21 |
| Process lifecycle (scope) | `agent-mux-scope.md` | 22 |
| Package structure (scope) | `agent-mux-scope.md` | 24 |

---

## 2. Invocation Syntax

```
amux [command] [subcommand] [positional-args...] [flags...]
```

When invoked without a command, `amux` prints a help summary and exits with code 0.

When invoked with an unrecognized command, `amux` prints an error message with suggestions and exits with code 2.

---

## 3. Global Flags

Global flags are accepted by every command. They are parsed before command-specific flags and override corresponding environment variables and config file values.

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--agent` | `-a` | `AgentName` | Config default | Target agent name. Accepted values: `claude`, `codex`, `gemini`, `copilot`, `cursor`, `opencode`, `pi`, `omp`, `openclaw`, `hermes`, or any plugin-registered adapter name. |
| `--model` | `-m` | `string` | Agent default | Model ID for the target agent. Must be a model ID recognized by the agent's adapter. |
| `--json` | -- | `boolean` | `false` | Output as machine-readable JSON or JSONL. See Section 5 for output mode details. |
| `--debug` | -- | `boolean` | `false` | Enable debug output. Includes raw event data in JSONL output and verbose logging to stderr. |
| `--config-dir` | -- | `string` | `~/.agent-mux/` | Override the global configuration directory. Equivalent to `createClient({ configDir })`. |
| `--project-dir` | -- | `string` | `.agent-mux/` | Override the project-local configuration directory. Equivalent to `createClient({ projectConfigDir })`. |
| `--no-color` | -- | `boolean` | `false` | Disable colored output. Also activated when the `NO_COLOR` environment variable is set to any non-empty value, or when stdout is not a TTY. |
| `--version` | `-V` | `boolean` | -- | Print the `@a5c-ai/agent-mux-cli` version and exit. |
| `--help` | `-h` | `boolean` | -- | Print help for the current command and exit. Available on every command and subcommand. |
| `--completions` | -- | `string` | -- | Generate shell completion script: `bash`, `zsh`, `fish`, `powershell`. See Section 22. |

### 3.1 Flag Parsing Rules

- Long flags use `--kebab-case` (e.g., `--thinking-effort`, `--config-dir`).
- Short flags are single-character prefixed with `-` (e.g., `-a`, `-m`, `-i`, `-q`, `-y`).
- Boolean flags do not take a value (`--json` enables JSON mode; `--no-stream` disables streaming).
- Repeatable flags accept multiple values by specifying the flag multiple times (e.g., `--tag build --tag test`).
- `--env` flags use `KEY=VALUE` syntax (e.g., `--env ANTHROPIC_API_KEY=sk-...`).
- `--` terminates flag parsing; all subsequent arguments are treated as positional.

---

## 4. Exit Codes

The `amux` binary uses the following exit codes. These are the only exit codes produced by the CLI itself. When `amux run` is used, the agent subprocess exit code is available in the JSONL output but does not propagate as the `amux` process exit code unless the agent crashed.

| Code | Name | Description | Corresponding `ErrorCode` |
|---|---|---|---|
| 0 | Success | Command completed successfully. | -- |
| 1 | General error | An error occurred during execution. | Varies (see `error` event) |
| 2 | Usage error | Invalid command syntax, unknown flag, or missing required argument. | `VALIDATION_ERROR` |
| 3 | Agent not found | The specified agent has no registered adapter. | `AGENT_NOT_FOUND` |
| 4 | Agent not installed | The agent adapter exists but the CLI binary is not on `$PATH`. | `AGENT_NOT_INSTALLED` |
| 5 | Auth error | Authentication is required but not configured or expired. | `AUTH_ERROR` |
| 6 | Capability error | The requested operation requires a capability the agent does not support. | `CAPABILITY_ERROR` |
| 7 | Config error | Configuration file could not be read, parsed, or written. | `CONFIG_ERROR` |
| 8 | Session not found | The specified session does not exist. | `SESSION_NOT_FOUND` |
| 9 | Profile not found | The specified profile does not exist. | `PROFILE_NOT_FOUND` |
| 10 | Plugin error | Plugin operation failed (install, uninstall, search, etc.). | `PLUGIN_ERROR` |
| 11 | Timeout | The run exceeded its timeout or inactivity timeout. | `TIMEOUT` or `INACTIVITY_TIMEOUT` |
| 12 | Agent crashed | The agent subprocess terminated unexpectedly. | `AGENT_CRASH` |
| 13 | Aborted | The run was aborted by the user (e.g., via SIGINT). | `ABORTED` |
| 14 | Rate limited | The agent reported a rate limit. | `RATE_LIMITED` |
| 15 | Context exceeded | The agent's context window was exceeded. | `CONTEXT_EXCEEDED` |

### 4.1 Exit Code Mapping

The CLI maps `ErrorCode` values from the SDK to exit codes as shown above. When multiple errors occur, the exit code reflects the first fatal error. Non-fatal errors (e.g., `RATE_LIMITED` with a successful retry) do not affect the exit code.

The following `ErrorCode` values map to exit code 1 (General error) as they have no dedicated exit code:

| `ErrorCode` | Rationale |
|---|---|
| `SPAWN_ERROR` | Agent subprocess failed to spawn (bad path, permissions, missing binary). Distinct from `AGENT_NOT_INSTALLED` (binary not found on PATH) in that the binary was found but could not be executed. |
| `INTERNAL` | Internal agent-mux error (bug). Should not occur in normal operation. |
| `PARSE_ERROR` | An agent's output could not be parsed. Distinct from `CONFIG_ERROR` in that it relates to runtime output, not config files. |

Note: `CONFIG_LOCK_ERROR` maps to exit code 7 (same as `CONFIG_ERROR`), not exit code 1, since it is a config-related error. It is not listed in the exit code 1 table above.

---

## 5. Output Modes

The CLI supports three output modes, selected by flags and context.

### 5.1 Human-Readable (Default)

When stdout is a TTY and `--json` is not set, the CLI produces formatted, colored output:

- **Tables**: aligned columns with headers for list commands (`adapters list`, `sessions list`, `models list`, etc.).
- **Streaming text**: for `amux run`, agent text output is printed to stdout as it arrives. Tool calls, thinking, and file operations are printed to stderr with visual indicators.
- **Progress indicators**: spinners and status lines for long-running operations (install, plugin operations).
- **Color**: ANSI color codes for emphasis, status indicators, and error highlighting. Disabled by `--no-color`, `NO_COLOR` env var, or non-TTY stdout.

### 5.2 JSON (`--json`)

When `--json` is set on non-streaming commands (e.g., `adapters list --json`, `sessions list --json`, `models list --json`), the CLI outputs a single JSON object or array to stdout:

```json
{
  "ok": true,
  "data": [ ... ]
}
```

On error:

```json
{
  "ok": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "No adapter registered for agent 'foo'",
    "recoverable": false
  }
}
```

### 5.3 JSONL Event Stream (`amux run --json`)

When `--json` is set on `amux run`, the CLI outputs one JSON object per line to stdout. Each line is a serialized `AgentEvent` object as defined in `04-agent-events.md`. The final line is always a `RunResult` object with `type: "run_result"`.

```jsonl
{"type":"session_start","runId":"01J...","agent":"claude","timestamp":1718000000000,"sessionId":"abc123","resumed":false}
{"type":"text_delta","runId":"01J...","agent":"claude","timestamp":1718000000100,"delta":"Hello","accumulated":"Hello"}
{"type":"message_stop","runId":"01J...","agent":"claude","timestamp":1718000000200,"text":"Hello, world!"}
{"type":"run_result","runId":"01J...","agent":"claude","model":"claude-sonnet-4-20250514","sessionId":"abc123","text":"Hello, world!","exitCode":0,"exitReason":"completed","durationMs":1200,"turnCount":1}
```

When `--debug` is combined with `--json`, each event includes the `raw` field containing the unparsed agent output line.

Human-readable progress (spinners, status) is suppressed in JSONL mode. Diagnostic messages go to stderr.

---

## 6. `amux run` -- Run an Agent

Invoke an agent with a prompt. This is the primary command.

### 6.1 Syntax

```
amux run [<agent>] [<prompt>] [flags...]
```

Both `<agent>` and `<prompt>` are optional positional arguments:

- If `<agent>` is omitted, the default agent from config is used (`GlobalConfig.defaultAgent` or `--agent` global flag).
- If `--prompt` / `-p` is provided, it supplies the initial prompt and takes precedence over positional prompt text.
- If no explicit prompt is provided and stdin is not a TTY, the prompt is read from stdin (see Section 14).
- If no explicit prompt is provided and stdin is a TTY and `--interactive` is not set, the CLI prints an error and exits with code 2.
- If both are provided as positionals, the first argument is parsed as an agent name if it matches a registered adapter; otherwise, the entire positional is treated as the prompt and the default agent is used.

### 6.2 Flags

| Flag | Short | Type | Default | Maps to `RunOptions` | Description |
|---|---|---|---|---|---|
| `--model` | `-m` | `string` | Agent default | `model` | Model ID. |
| `--stream` | -- | `boolean` | `true` | `stream: true` | Enable streaming output. |
| `--no-stream` | -- | `boolean` | -- | `stream: false` | Disable streaming; buffer all output. |
| `--thinking-effort` | -- | `string` | -- | `thinkingEffort` | Thinking effort: `low`, `medium`, `high`, `max`. |
| `--thinking-budget` | -- | `number` | -- | `thinkingBudgetTokens` | Thinking budget in tokens. Minimum 1024. |
| `--temperature` | -- | `number` | -- | `temperature` | Sampling temperature (0.0–2.0). Capability-gated. |
| `--top-p` | -- | `number` | -- | `topP` | Top-p sampling (0.0–1.0). Capability-gated. |
| `--top-k` | -- | `number` | -- | `topK` | Top-k sampling (>= 1). Capability-gated. |
| `--thinking-override` | -- | `string` | -- | `thinkingOverride` | Native thinking parameter override as a JSON string. Passed directly to the agent's API. Use for agent-specific thinking controls not covered by `--thinking-effort` or `--thinking-budget`. Example: `--thinking-override '{"type":"enabled","budget_tokens":8192}'`. |
| `--max-tokens` | -- | `number` | -- | `maxTokens` | Maximum output tokens. |
| `--max-output-tokens` | -- | `number` | -- | `maxOutputTokens` | Alias for `--max-tokens`. If both are set, `--max-output-tokens` wins. |
| `--max-turns` | -- | `number` | -- | `maxTurns` | Maximum agentic turns (tool-use loops). |
| `--session` | -- | `string` | -- | `sessionId` | Resume session by native session ID. |
| `--fork` | -- | `string` | -- | `forkSessionId` | Fork session by native session ID. |
| `--no-session` | -- | `boolean` | `false` | `noSession: true` | Ephemeral run; do not persist session. |
| `--system` | -- | `string` | -- | `systemPrompt` | System prompt text. |
| `--system-mode` | -- | `string` | `prepend` | `systemPromptMode` | System prompt mode: `prepend`, `append`, `replace`. |
| `--cwd` | -- | `string` | `process.cwd()` | `cwd` | Working directory for the agent subprocess. Must be an absolute path to an existing directory. |
| `--env` | -- | `string` | -- | `env` | Environment variable in `KEY=VALUE` format. Repeatable. |
| `--prompt` | `-p` | `string` | -- | -- | Initial prompt text. Equivalent to the positional `<prompt>`, but unambiguous in scripts. |
| `--non-interactive` | -- | `boolean` | `false` | `nonInteractive: true` | Force headless one-shot harness mode. Harness prompt flags are only used when this is paired with `--prompt`. |
| `--yolo` | -- | `boolean` | -- | `approvalMode: 'yolo'` | Auto-approve all tool calls and file operations. |
| `--deny` | -- | `boolean` | -- | `approvalMode: 'deny'` | Auto-deny all actions requiring approval. |
| `--timeout` | -- | `number` | `0` | `timeout` | Run timeout in milliseconds. 0 disables. |
| `--inactivity-timeout` | -- | `number` | `0` | `inactivityTimeout` | Inactivity timeout in milliseconds. 0 disables. |
| `--output-format` | -- | `string` | `text` | `outputFormat` | Agent output format: `text`, `json`, `jsonl`. |
| `--tag` | -- | `string` | -- | `tags` | Run tag for cost roll-ups and session search. Repeatable. |
| `--run-id` | -- | `string` | Auto ULID | `runId` | Custom run ID (must be a valid ULID). |
| `--attach` | -- | `string` | -- | `attachments` | File path to attach. Repeatable. Supports images and text files. Capability-gated (`supportsFileAttachments`). |
| `--skill` | -- | `string` | -- | `skills` | Skill file or directory path. Repeatable. Capability-gated (`supportsSkills`). |
| `--agents-doc` | -- | `string` | -- | `agentsDoc` | Path to an agents.md document. Capability-gated (`supportsAgentsMd`). |
| `--mcp-server` | -- | `string` | -- | `mcpServers` | MCP server name (must exist in config). Repeatable. Overrides the default MCP server set. Capability-gated (`supportsMCP`). |
| `--project-id` | -- | `string` | -- | `projectId` | Project identifier for cost tracking and session grouping. Stored in `run-index.jsonl`. |
| `--profile` | -- | `string` | -- | `profile` | Named profile to apply as the base. |
| `--interactive` | `-i` | `boolean` | `false` | -- | Enter interactive REPL mode (see Section 13). |
| `--json` | -- | `boolean` | `false` | -- | Emit JSONL event stream to stdout. |
| `--quiet` | `-q` | `boolean` | `false` | -- | Suppress non-essential output (tool calls, thinking, file ops). Only print final text. |

#### SDK-Only RunOptions (No CLI Flag)

The following `RunOptions` fields are intentionally not exposed as CLI flags:

| `RunOptions` Field | Reason |
|---|---|
| `retryPolicy` | Complex `RetryPolicy` object with `maxRetries`, `baseDelay`, `maxDelay`, `backoffMultiplier` fields. Not suitable for a single CLI flag. Configure via profile or config file. |
| `onInputRequired` | Callback function. The CLI handles input_required events internally (prompts user or auto-denies in non-interactive mode). |
| `onApprovalRequest` | Callback function. The CLI handles approval_request events via `--yolo` / `--deny` flags or interactive prompts. |

### 6.3 Mutual Exclusion

The following flag combinations are invalid and produce exit code 2:

- `--session` + `--no-session`
- `--session` + `--fork`
- `--fork` + `--no-session`
- `--yolo` + `--deny`
- `--stream` + `--no-stream`

### 6.4 Flag-to-RunOptions Mapping

The CLI constructs a `RunOptions` object from flags. Resolution order (highest precedence first):

1. Explicit CLI flags.
2. Profile values (if `--profile` is set).
3. Project config values (`.agent-mux/config.json`).
4. Global config values (`~/.agent-mux/config.json`).
5. Adapter defaults.

This matches the resolution order defined in `02-run-options-and-profiles.md`, Section 7.

### 6.5 Behavior

1. The CLI calls `createClient()` with global flag overrides.
2. Resolves the initial prompt from `--prompt`, positional args, or stdin.
3. Constructs `RunOptions` from flags, profile, and config.
4. Calls `mux.run(options)` to obtain a `RunHandle`.
5. By default, the initial prompt is delivered to stdin-capable harnesses over stdin so the harness stays interactive. When `--prompt` and `--non-interactive` are both set, agent-mux instead uses the harness's one-shot prompt flag/path.
6. Consumes events from the `RunHandle`:
   - **Human mode**: prints text deltas to stdout, tool calls and thinking to stderr.
   - **JSONL mode** (`--json`): writes each `AgentEvent` as one JSON line to stdout.
   - **Quiet mode** (`-q`): suppresses everything except the final `message_stop` text.
7. On `approval_request` events (when `approvalMode` is `'prompt'` and not `--yolo`/`--deny`):
   - **Interactive terminal**: prompts the user on stderr, reads response from stdin.
   - **Non-interactive** (pipe, no TTY): auto-denies with a warning to stderr.
8. On `input_required` events:
   - **Interactive terminal**: prompts on stderr, reads from stdin.
   - **Non-interactive**: emits the event in JSONL mode; otherwise errors.
9. Awaits `RunResult`. Prints cost summary to stderr (unless `--quiet`).
10. Exits with the appropriate exit code (see Section 4).

### 6.6 API Mapping

| CLI | SDK |
|---|---|
| `amux run claude "hello"` | `mux.run({ agent: 'claude', prompt: 'hello' })` |
| `amux run --profile fast "hello"` | `mux.run({ profile: 'fast', prompt: 'hello' })` |
| `amux run -a gemini --yolo "fix tests"` | `mux.run({ agent: 'gemini', prompt: 'fix tests', approvalMode: 'yolo' })` |

### 6.7 Examples

```bash
# Basic run
amux run claude "explain this codebase"

# Run with thinking and model override
amux run claude --model claude-sonnet-4-20250514 --thinking-effort high "refactor auth module"

# Ephemeral run with auto-approve
amux run codex --no-session --yolo "add unit tests for utils.ts"

# Resume session
amux run claude --session abc123 "continue from where we left off"

# Fork session
amux run claude --fork abc123 "try a different approach"

# JSONL output for piping
amux run gemini --json "list all TODO items" | jq 'select(.type == "text_delta") | .delta'

# With tags for cost tracking
amux run claude --tag feature/auth --tag sprint-42 "implement oauth flow"

# Using a profile
amux run --profile careful "review this PR"

# Quiet mode -- only final text
amux run claude -q "what is 2+2"
```

---

## 6b. `amux launch` -- Launch a Harness with Provider Flexibility

Start (or resume) an interactive or non-interactive coding agent session with full stdin/stdout passthrough. Unlike `amux run`, which normalizes output into the `AgentEvent` stream, `amux launch` is a **transparent proxy** — the user interacts directly with the harness as if they invoked it natively. Its key additional capability is unified provider resolution: you can point any supported harness at any LLM provider, with `amux-proxy` bridging the gap when the harness cannot speak the provider's native wire protocol.

See [launcher](../archive/design/launcher.md) for the archived launcher specification and [provider & model configuration](../archive/design/amux-provider-config.md) for the archived provider-configuration design.

| Concern | `amux run` | `amux launch` |
|---|---|---|
| Output format | Normalized `AgentEvent` stream | Raw harness output (bypass) |
| Input format | `RunOptions` / SDK API | Raw stdin passthrough |
| Provider config | N/A (each harness's own) | Unified provider/model resolution |
| Proxy orchestration | No | Yes (`--with-proxy-if-needed`) |
| Use case | Programmatic orchestration, multi-agent | Direct harness usage with provider flexibility |

### 6b.1 Syntax

```
amux launch <harness> [provider] [flags...]
```

**Positional arguments:**

| Argument | Required | Description |
|---|---|---|
| `<harness>` | Yes | Target harness name. Registered `SubprocessAdapter.agent` values: `claude`, `codex`, `gemini`, `opencode`, `copilot`, `cursor`, `pi`, `omp`, `openclaw`, `hermes`, `droid`, `amp`, `qwen`. |
| `[provider]` | No | Provider/backend identifier. If omitted, the harness's default native provider is used. See §6b.3 for the full taxonomy. |

### 6b.2 Flags

#### Provider Configuration

| Flag | Short | Type | Description |
|---|---|---|---|
| `--model` | `-m` | `string` | Model identifier (provider-specific format). Required for non-default providers. |
| `--api-key` | | `string` | API key for the target provider. Can also be set via provider-specific env vars. |
| `--api-base` | | `string` | Custom API base URL. Overrides provider defaults. |
| `--region` | | `string` | Cloud region (for Bedrock, Vertex). |
| `--project` | | `string` | Cloud project ID (for Vertex, Foundry). |
| `--resource-group` | | `string` | Resource group (for Azure/Foundry). |
| `--endpoint-name` | | `string` | Named deployment/endpoint (Azure, Foundry, Bedrock). |
| `--transport` | `-t` | `string` | Wire protocol the harness should speak. One of: `anthropic`, `openai-chat`, `openai-responses`, `google`. Default: auto-detected from harness and provider. |
| `--profile` | | `string` | Named provider profile from `~/.amux/providers.json`. |
| `--auth-command` | | `string` | External command that emits a bearer token on stdout. |

#### Proxy Control

| Flag | Type | Default | Description |
|---|---|---|---|
| `--with-proxy-if-needed` | `boolean` | `false` | Launch `amux-proxy` automatically if the harness cannot speak the provider's native transport directly. |
| `--with-proxy` | `boolean` | `false` | Force proxy launch even if the harness supports the provider natively. Useful for observability or logging. |
| `--no-proxy` | `boolean` | `false` | Explicitly disable proxy. Errors if the harness cannot reach the provider without one. |
| `--proxy-port` | `number` | `0` (auto) | Port for the proxy server. `0` = OS-assigned ephemeral port. |
| `--proxy-log-level` | `string` | `warn` | Log level for the proxy process: `debug`, `info`, `warn`, `error`. |

#### Session Control

| Flag | Short | Type | Description |
|---|---|---|---|
| `--resume` | `-r` | `string` | Resume an existing session by ID or name. Passes the harness-specific resume flag through. |
| `--session-id` | `-s` | `string` | Explicit session ID for a new session. |

#### Execution Mode

| Flag | Short | Type | Description |
|---|---|---|---|
| `--prompt` | `-p` | `string` | Initial prompt. When set, runs in **non-interactive** mode: sends the prompt, streams output, and exits when the harness exits. When omitted, runs in **interactive** mode with full stdin/stdout passthrough. |
| `--max-turns` | | `number` | Turn limit (non-interactive mode). |
| `--max-budget-usd` | | `number` | Cost limit (where the harness supports it). |

#### Bridge Control

| Flag | Type | Default | Description |
|---|---|---|---|
| `--bridge-interactive` | `boolean` | `false` | Enable the interactive bridge layer, which proxies stdin/stdout through an intermediary that can inject babysitter hook responses and orchestration signals while preserving the harness's native TUI. |
| `--bridge-hooks` | `boolean` | `false` | Enable hook bridging: the bridge intercepts hook lifecycle events (SessionStart, Stop, PreToolUse, etc.) and forwards them to the babysitter session-start hook, which can bind the session to a bare run. Requires `--bridge-interactive` or is implied by it when the harness supports hooks natively. |

#### Harness Passthrough

| Flag | Type | Description |
|---|---|---|
| `--harness-args` | `string[]` | Raw arguments forwarded verbatim to the harness CLI after all amux-managed args. Use the `--` separator: `amux launch claude api -- --bare --verbose`. |

#### General

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--json` | | `boolean` | `false` | Output machine-readable JSON for launch status and proxy lifecycle events. Does not affect raw harness output. |
| `--debug` | `-d` | `boolean` | `false` | Debug mode. Logs proxy and harness process details to stderr. |
| `--dry-run` | | `boolean` | `false` | Print the resolved command, env vars, and proxy config as JSON without executing. |

### 6b.3 Supported Provider IDs

| Provider ID | Description | Default Transport | Default Auth |
|---|---|---|---|
| `anthropic` | Anthropic direct API | `anthropic` | API key |
| `openai` | OpenAI direct API | `openai-responses` | API key |
| `google` | Google AI Studio | `google` | API key |
| `bedrock` | AWS Bedrock | `anthropic` | IAM / AWS profile |
| `vertex` | Google Vertex AI | `google` | ADC / service account |
| `azure` | Azure OpenAI | `openai-chat` | API key / AD token |
| `foundry` | Azure AI Foundry | `openai-chat` | API key / AD token |
| `ollama` | Local Ollama instance | `openai-chat` | None |
| `local` | Generic local model server | `openai-chat` | None |
| `openrouter` | OpenRouter | `openai-chat` | API key |
| `groq` | Groq | `openai-chat` | API key |
| `fireworks` | Fireworks AI | `openai-chat` | API key |
| `together` | Together AI | `openai-chat` | API key |
| `deepseek` | DeepSeek | `openai-chat` | API key |
| `mistral` | Mistral AI | `openai-chat` | API key |
| `cerebras` | Cerebras | `openai-chat` | API key |
| `sambanova` | SambaNova | `openai-chat` | API key |
| `custom` | User-defined endpoint | Requires `--transport` | Any (via flags) |

### 6b.4 Supported Transport IDs

| Transport ID | Endpoint | Wire Format | Used By |
|---|---|---|---|
| `anthropic` | `POST /v1/messages` | Anthropic Messages API (SSE) | Claude Code |
| `openai-chat` | `POST /v1/chat/completions` | OpenAI Chat Completions | OpenCode, Codex (`wire_api=chat`) |
| `openai-responses` | `POST /v1/responses` | OpenAI Responses API | Codex (default) |
| `google` | `POST /v1beta/models/:model:generateContent` | Google GenerateContent | Gemini CLI |

### 6b.5 Native Support Matrix

This matrix shows which harness+provider combinations work **without** a proxy. Use `--with-proxy-if-needed` for combinations marked with a cross.

| | `anthropic` | `bedrock` | `vertex` | `azure` | `foundry` | `google` | `openai` | `ollama` |
|---|---|---|---|---|---|---|---|---|
| **claude** | Native | Native | Native | No | Native | No | No | Via `ANTHROPIC_BASE_URL` |
| **codex** | No | No | No | No | No | No | Native | Native (`--oss`) |
| **gemini** | No | No | Native (ADC) | No | No | Native | No | No |
| **opencode** | Native | Native (SDK) | Native (SDK) | Native (SDK) | No | Native (SDK) | Native | OpenAI-compat |
| **copilot** | No | No | No | No | No | No | No | No |
| **cursor** | Native | No | No | No | No | No | No | No |

Cells marked "No" require `--with-proxy-if-needed`. Cells marked "Via `ANTHROPIC_BASE_URL`" or "OpenAI-compat" work with an env var workaround but a proxy is recommended for reliability.

### 6b.6 Examples

```bash
# Interactive Claude Code with default provider (Anthropic direct)
amux launch claude

# Interactive Claude Code via Bedrock (native, no proxy needed)
amux launch claude bedrock --region us-east-1

# Interactive Claude Code via Vertex (native)
amux launch claude vertex --project my-gcp-project --region us-central1

# Interactive Codex via Bedrock (proxy required: codex speaks OpenAI, bedrock speaks Anthropic)
amux launch codex bedrock --region us-east-1 \
  --model anthropic.claude-sonnet-4-20250514-v1:0 \
  --with-proxy-if-needed

# Non-interactive (one-shot) run via Vertex
amux launch claude vertex --project my-project --region us-central1 \
  -p "Explain the authentication flow in this codebase" \
  --max-turns 3

# Interactive Codex via Ollama (local, no proxy needed with --oss flag)
amux launch codex ollama --model qwen3:32b

# Interactive Claude Code via Ollama (proxy bridges Ollama to Anthropic transport)
amux launch claude ollama --model qwen3:32b --with-proxy-if-needed

# Use a named provider profile from ~/.amux/providers.json
amux launch claude --profile work-bedrock

# Dry run: see what would be executed without running it
amux launch codex bedrock --region us-east-1 --model anthropic.claude-sonnet-4-20250514-v1:0 \
  --with-proxy-if-needed --dry-run

# Passthrough raw harness args after --
amux launch claude api -- --bare --verbose
```

### 6b.7 Non-Interactive vs Interactive Mode

**Interactive mode** (default, no `--prompt`): stdin, stdout, and stderr are passed through directly to the harness. The user interacts with the harness TUI natively. `amux` only manages the proxy lifecycle and process signals.

**Non-interactive mode** (`--prompt` is set): the prompt is delivered to the harness via its native mechanism (e.g., `--print` for claude, `exec` for codex, `--prompt` for gemini). stdout and stderr are still passed through raw. The process exits when the harness completes its response. Suitable for scripting and CI/CD.

### 6b.8 Error Codes

| Code | Condition |
|---|---|
| `HARNESS_NOT_FOUND` | Unknown harness name. |
| `HARNESS_NOT_INSTALLED` | Harness binary not found on `$PATH`. |
| `PROVIDER_UNSUPPORTED` | Harness+provider combo has no native support and proxy is not enabled. |
| `PROXY_REQUIRED` | Proxy required but `--no-proxy` is set. |
| `PROXY_LAUNCH_FAILED` | `amux-proxy` failed to start. Check that it is installed: `pip install amux-proxy`. |
| `AUTH_MISSING` | Required provider auth not supplied. |

---

## 7. `amux install` -- Install Agent CLIs

Install or display installation instructions for agent CLI binaries.

### 7.1 Syntax

```
amux install <agent> [flags...]
```

`<agent>` is required. Must be one of the ten built-in agent names: `claude`, `codex`, `gemini`, `copilot`, `cursor`, `opencode`, `pi`, `omp`, `openclaw`, `hermes`.

### 7.2 Flags

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--dry-run` | -- | `boolean` | `false` | Print the install commands without executing them. |
| `--method` | -- | `string` | Auto-detected | Force a specific install method: `npm`, `pip`, `brew`, `gh-extension`, `curl`, `winget`, `scoop`, `manual`. |
| `--yes` | `-y` | `boolean` | `false` | Non-interactive: execute install commands without confirmation prompts. |

### 7.3 Behavior

1. Resolves the adapter for `<agent>`.
2. Reads `AgentCapabilities.installMethods` filtered by the current platform (`process.platform`).
3. If `--method` is specified, selects only the matching install method. Exits with code 2 if no method matches.
4. For each matching install method:
   a. Checks prerequisites (`InstallMethod.prerequisiteCheck`) if defined. Prints a warning if the prerequisite is not met.
   b. Prints the install command to stdout.
   c. Unless `--dry-run`: prompts for confirmation (unless `--yes`), then executes the command as a child process, streaming stdout/stderr to the terminal.
5. After installation, runs `mux.adapters.detect(agent)` to verify the install succeeded and prints the detected version.

### 7.4 Install Methods per Agent

| Agent | Method | Command | Platform | Notes |
|---|---|---|---|---|
| `claude` | npm | `npm install -g @anthropic-ai/claude-code` | all | -- |
| `claude` | brew | `brew install claude-code` | darwin | -- |
| `codex` | npm | `npm install -g @openai/codex` | all | -- |
| `gemini` | npm | `npm install -g @google/gemini-cli` | all | -- |
| `copilot` | gh-extension | `gh extension install github/gh-copilot` | all | Requires GitHub CLI (`gh`). Prerequisite check: `gh --version`. |
| `cursor` | manual | Opens download page | darwin, linux | No headless-only install. Full app required. |
| `cursor` | winget | `winget install Cursor.Cursor` | win32 | -- |
| `opencode` | npm | `npm install -g opencode` | all | -- |
| `opencode` | brew | `brew install opencode/tap/opencode` | darwin | -- |
| `pi` | npm | `npm install -g @earendil-works/pi-coding-agent` | all | -- |
| `omp` | npm | `npm install -g @oh-my-pi/pi-coding-agent` | all | -- |
| `openclaw` | npm | `npm install -g openclaw` | all | Requires Node 22.16+, 16GB RAM minimum. |
| `hermes` | pip | `pip install hermes-agent` | all | Requires Python >= 3.11. Alternative: `uv pip install hermes-agent`. |

### 7.5 API Mapping

| CLI | SDK |
|---|---|
| `amux install claude` | `mux.adapters.installInstructions('claude', process.platform)` |
| `amux install --dry-run gemini` | `mux.adapters.installInstructions('gemini', process.platform)` (display only) |

### 7.6 Examples

```bash
# Install Claude Code
amux install claude

# See what would be installed without running
amux install --dry-run gemini

# Force npm method
amux install opencode --method npm

# Non-interactive install
amux install codex --yes

# Install hermes (Python agent)
amux install hermes
```

---

## 8. `amux adapters` -- Adapter Discovery

List and inspect registered adapters and their installation state.

### 8.1 Syntax

```
amux adapters list [flags...]
amux adapters detect <agent> [flags...]
```

### 8.2 `amux adapters list`

Lists all registered adapters with their installation status, version, and authentication state.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--json` | `boolean` | `false` | Output as JSON array. |

**Output columns (human mode):**

| Column | Description |
|---|---|
| Agent | Agent name. |
| Installed | `yes` / `no`. |
| Version | Detected version string, or `--` if not installed. |
| Auth | `authenticated`, `unauthenticated`, `expired`, `unknown`, or `--`. |
| Path | Absolute path to CLI binary, or `--`. |

**API mapping:** `mux.adapters.list()` combined with `mux.adapters.installed()` for the installed/version/auth columns.

### 8.3 `amux adapters detect <agent>`

Detect a single agent: checks installation, resolves the binary path, detects the version, and checks authentication state.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--json` | `boolean` | `false` | Output as JSON object. |

**Output (human mode):** Key-value pairs:

```
Agent:     claude
Installed: yes
Path:      /usr/local/bin/claude
Version:   1.2.3
Min version: 1.0.0
Meets min:  yes
Auth:      authenticated
Model:     claude-sonnet-4-20250514
```

**API mapping:** `mux.adapters.detect('claude')` returns `InstalledAgentInfo`.

### 8.4 Error Behavior

- Unknown agent name: exit code 3 (`AGENT_NOT_FOUND`).
- Agent not installed (for `detect`): prints the detection result showing `installed: false`, exits with code 0 (detection succeeded; the result is "not installed").

---

## 9. `amux capabilities` -- Agent Capabilities

Display the capabilities manifest for an agent, optionally scoped to a specific model.

### 9.1 Syntax

```
amux capabilities <agent> [flags...]
```

### 9.2 Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--model` | `string` | -- | Show model-level capabilities for a specific model ID. |
| `--json` | `boolean` | `false` | Output as JSON object. |

### 9.3 Behavior

- Without `--model`: prints agent-level capabilities (`AgentCapabilities`) as defined in `06-capabilities-and-models.md`, Section 2.
- With `--model`: prints the union of agent-level and model-level capabilities (`ModelCapabilities`) for the specified model.

**Output (human mode):** Grouped key-value display organized by category (session, streaming, tool calling, thinking, output, skills, plugins, process, auth, install).

**API mapping:**

| CLI | SDK |
|---|---|
| `amux capabilities claude` | `mux.adapters.capabilities('claude')` |
| `amux capabilities claude --model claude-sonnet-4-20250514` | `mux.adapters.capabilities('claude')` + `mux.models.model('claude', 'claude-sonnet-4-20250514')` |

### 9.4 Error Behavior

- Unknown agent: exit code 3 (`AGENT_NOT_FOUND`).
- Unknown model (with `--model`): exit code 1, error message listing available models.

---

## 10. `amux models` -- Model Registry

List, inspect, and refresh model metadata for agents.

### 10.1 Syntax

```
amux models list <agent> [flags...]
amux models get <agent> <model-id> [flags...]
amux models refresh <agent> [flags...]
amux models current <agent> [flags...]
amux models set <agent> <model-id> [--provider <provider>] [flags...]
```

### 10.2 `amux models list <agent>`

List all models available for an agent.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--json` | `boolean` | `false` | Output as JSON array. |

**Output columns (human mode):**

| Column | Description |
|---|---|
| Model ID | The model identifier string. |
| Display Name | Human-readable name. |
| Provider | Normalized provider family (`anthropic`, `openai`, `configurable`, etc.). |
| Protocol | Normalized request protocol (`messages`, `responses`, `chat`, `custom`). |
| Deploy | Typical deployment path (`hosted`, `local`, `gateway`, `hybrid`). |
| Context Window | Maximum context in tokens. |
| Source | `bundled` or `remote`. |
| Default | Whether this is the adapter's default model. |

**API mapping:** `mux.models.catalog('claude')` returns the per-adapter model catalog with default-entry metadata.

### 10.3 `amux models get <agent> <model-id>`

Show detailed capabilities for a single model.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--json` | `boolean` | `false` | Output as JSON object. |

**Output (human mode):** Key-value display showing all `ModelCapabilities` fields.

**API mapping:** `mux.models.model('claude', 'claude-sonnet-4-20250514')` returns `ModelCapabilities | null`.

### 10.4 `amux models refresh <agent>`

Refresh the model list from the agent's remote source (where applicable).

**API mapping:** `mux.models.refresh('claude')`.

### 10.5 `amux models current <agent>`

Show the configured model, adapter default, and effective model selection for an agent.

**API mapping:** `mux.config.getModelSelection('claude')` plus `mux.models.model(...)` for effective-model details.

### 10.6 `amux models set <agent> <model-id>`

Validate and persist the configured model for an agent. Optional `--provider` records the selected provider for configurable/local-provider adapters.

**API mapping:** `mux.models.validate('claude', 'sonnet')` followed by `mux.config.setModelSelection('claude', { model, provider })`.

### 10.7 Error Behavior

- Unknown agent: exit code 3 (`AGENT_NOT_FOUND`).
- Unknown model (for `get`): exit code 1, error message listing available models.

---

## 11. `amux plugin` -- Native Plugin Management

Unified interface for managing native agent plugins through CLI delegation. Commands delegate to each agent's native plugin system (e.g., `claude plugins`, `copilot plugin`, `gemini extensions`). All subcommands are capability-gated: invoking on an agent where native plugin CLI commands don't exist produces exit code 6 (`CAPABILITY_ERROR`).

### 11.1 Syntax

```
amux plugin list <agent> [flags...]
amux plugin install <agent> <plugin-id> [flags...]
amux plugin uninstall <agent> <plugin-id> [flags...]
amux plugin update <agent> <plugin-id> [flags...]
amux plugin marketplace <agent> [subcommand] [flags...]
```

### 11.2 `amux plugin list <agent>`

List installed plugins for an agent via native CLI.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--json` | `boolean` | `false` | Output as JSON array. |

**API mapping:** Delegates to agent's native command (e.g., `claude plugins list`).

### 11.3 `amux plugin install <agent> <plugin-id>`

Install a plugin via agent's native CLI.

**Flags:**

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--yes` | `-y` | `boolean` | `false` | Skip confirmation prompt. |

**API mapping:** Delegates to agent's native install command.

### 11.4 `amux plugin uninstall <agent> <plugin-id>`

Uninstall a plugin via agent's native CLI.

**Flags:**

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--yes` | `-y` | `boolean` | `false` | Skip confirmation prompt. |

**API mapping:** Delegates to agent's native uninstall command.

### 11.5 `amux plugin update <agent> <plugin-id>`

Update a plugin via agent's native CLI.

**API mapping:** Delegates to agent's native update command.

### 11.6 `amux plugin marketplace <agent> [subcommand]`

Access agent's native plugin marketplace commands.

**API mapping:** Delegates to agent's marketplace commands (e.g., `claude plugins marketplace`).

### 11.7 Plugin Support per Agent

| Agent | Native Plugin Support | CLI Command |
|---|---|---|
| Claude | ✅ Full marketplace | `claude plugins` |
| Gemini | ✅ Extensions | `gemini extensions` |
| Codex | ✅ Plugin directory | `codex plugins` |
| Copilot | ✅ Plugin marketplace | `copilot plugin` |
| OpenCode | ✅ Three-tier system | `opencode plugins` |
| Cursor | ❌ Hook-only (see Section 12) | N/A |
| All others | ❌ MCP-only (see Section 12) | N/A |

### 11.8 Examples

```bash
# List installed plugins via native CLI
amux plugin list claude
amux plugin list gemini

# Install plugins via native marketplace
amux plugin install claude @anthropic/frontend-design
amux plugin install copilot github/copilot-agent

# Access native marketplace
amux plugin marketplace claude
amux plugin marketplace copilot
```

---

## 12. `amux mcp` -- MCP Server Management

Unified interface for managing Model Context Protocol servers across all agents. MCP servers provide cross-agent capabilities and integrations. All agents support MCP servers.

### 12.1 Syntax

```
amux mcp list <agent> [flags...]
amux mcp install <agent> <mcp-server> [flags...]
amux mcp uninstall <agent> <mcp-server> [flags...]
```

### 12.2 `amux mcp list <agent>`

List installed MCP servers for an agent.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--json` | `boolean` | `false` | Output as JSON array. |
| `--project` | `boolean` | `false` | List project-specific MCP servers only. |

**Output columns (human mode):**

| Column | Description |
|---|---|
| Server Name | MCP server identifier. |
| Status | `enabled` / `disabled`. |
| Command | Executable command. |
| Scope | `global` / `project`. |

### 12.3 `amux mcp install <agent> <mcp-server>`

Install an MCP server for an agent.

**Flags:**

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--project` | `-p` | `boolean` | `false` | Install to project scope (vs. global). |
| `--yes` | `-y` | `boolean` | `false` | Skip confirmation prompt. |

### 12.4 `amux mcp uninstall <agent> <mcp-server>`

Uninstall an MCP server from an agent.

**Flags:**

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--yes` | `-y` | `boolean` | `false` | Skip confirmation prompt. |

### 12.5 MCP Server Registry

All MCP servers are available from the official registry at [https://modelcontextprotocol.io](https://modelcontextprotocol.io).

### 12.6 Examples

```bash
# List MCP servers for an agent
amux mcp list claude
amux mcp list cursor

# Install MCP server globally
amux mcp install claude filesystem
amux mcp install gemini postgres

# Install MCP server to project
amux mcp install claude web-browser --project

# Remove MCP server
amux mcp uninstall claude filesystem
```

---

## 13. `amux sessions` -- Session Management

Read-only access to agent session data. The CLI delegates to `SessionManager` (see `07-session-manager.md`, Section 2). Session data is never modified by these commands.

### 12.1 Syntax

```
amux sessions list <agent> [flags...]
amux sessions show <agent> <session-id> [flags...]
amux sessions search <query> [flags...]
amux sessions export <agent> <session-id> [flags...]
amux sessions diff <agent>:<id> <agent>:<id> [flags...]
amux sessions resume <agent> <session-id> [flags...]
amux sessions fork <agent> <session-id> [flags...]
```

### 12.2 `amux sessions list <agent>`

List sessions for an agent.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--since` | `string` | -- | ISO 8601 date or relative (e.g., `2024-01-01`, `7d`, `1w`). Include sessions after this time. |
| `--until` | `string` | -- | ISO 8601 date or relative. Include sessions before this time. |
| `--model` | `string` | -- | Filter by model ID. |
| `--tag` | `string` | -- | Filter by run tag (from `run-index.jsonl`). Repeatable. |
| `--limit` | `number` | `50` | Maximum number of sessions to return. |
| `--sort` | `string` | `date` | Sort order: `date`, `cost`, `turns`. |
| `--json` | `boolean` | `false` | Output as JSON array. |

**Output columns (human mode):**

| Column | Description |
|---|---|
| Session ID | Native session identifier. |
| Model | Model ID used. |
| Turns | Number of conversation turns. |
| Cost | Total cost in USD. |
| Date | Session start date. |
| Summary | First line of the prompt (truncated). |

**API mapping:** `mux.sessions.list('claude', { since, until, model, tags, limit, sort })` returns `SessionSummary[]`.

### 12.3 `amux sessions show <agent> <session-id>`

Display the full content of a session.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--format` | `string` | `markdown` | Output format: `json`, `jsonl`, `markdown`. |

**API mapping:** `mux.sessions.export('claude', 'abc123', 'markdown')`.

### 12.4 `amux sessions tail <agent> [session-id]`

This command is not part of the current public CLI surface.

`@a5c-ai/agent-mux-comm` does not currently expose a truthful live session-watch API. Earlier
drafts described `mux.sessions.watch()`, but that contract was removed rather than shipping
synthetic `AgentEvent` payloads derived from arbitrary session-file changes.

### 12.5 `amux sessions search <query>`

Full-text search across sessions.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--agent` | `AgentName` | All | Restrict search to a specific agent. |
| `--since` | `string` | -- | Search sessions after this time. |
| `--until` | `string` | -- | Search sessions before this time. |
| `--json` | `boolean` | `false` | Output as JSON array. |

**API mapping:** `mux.sessions.search({ text: query, agent, since, until })` returns `SessionSummary[]`.

### 12.6 `amux sessions export <agent> <session-id>`

Export a session to a file or stdout.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--format` | `string` | `json` | Export format: `json`, `jsonl`, `markdown`. |

**Output:** The exported session content is written to stdout. Redirect to a file as needed.

**API mapping:** `mux.sessions.export('claude', 'abc123', 'json')` returns `string`.

### 12.7 `amux sessions diff <agent>:<id> <agent>:<id>`

Compute a structural diff between two sessions. Sessions may belong to the same or different agents.

**Syntax:** Each argument uses the unified ID format `<agent>:<native-session-id>`.

```bash
amux sessions diff claude:abc123 claude:def456
amux sessions diff claude:abc123 gemini:xyz789
```

**API mapping:** `mux.sessions.diff({ agent: 'claude', sessionId: 'abc123' }, { agent: 'gemini', sessionId: 'xyz789' })` returns `SessionDiff`.

### 12.8 `amux sessions resume <agent> <session-id>`

Resume a session by starting a new interactive run that continues from the specified session.

**Behavior:** Equivalent to `amux run <agent> --session <session-id> --interactive`. Enters REPL mode (see Section 13).

**API mapping:** `mux.run({ agent, sessionId, ... })` with interactive REPL loop.

### 12.9 `amux sessions fork <agent> <session-id>`

Fork a session and enter an interactive run on the new branch.

**Behavior:** Equivalent to `amux run <agent> --fork <session-id> --interactive`. Enters REPL mode.

**API mapping:** `mux.run({ agent, forkSessionId: sessionId, ... })` with interactive REPL loop.

### 12.10 Error Behavior

- Unknown agent: exit code 3 (`AGENT_NOT_FOUND`).
- Unknown session ID: exit code 8 (`SESSION_NOT_FOUND`).
- Corrupt session file: exit code 1 (`PARSE_ERROR`), with diagnostic message to stderr.

---

## 13. Interactive REPL Mode (`amux run -i`)

When `--interactive` / `-i` is set on `amux run`, the CLI enters a Read-Eval-Print Loop for multi-turn conversation with the agent.

### 13.1 Entry Conditions

REPL mode is entered when:
- `amux run -i` is invoked (with or without an initial prompt).
- `amux sessions resume` is invoked.
- `amux sessions fork` is invoked.

### 13.2 REPL Behavior

1. If an initial prompt is provided, it is sent as the first turn.
2. After the agent completes its response, the CLI prints a prompt indicator (for example, `amux>`) and waits for user input on stdin.
3. User input is sent to the running agent via `RunHandle.continue(prompt)`.
4. Tool approval requests are handled inline: the CLI prints the request and prompts for `[y]es / [n]o / [a]lways` on stderr.
5. The loop continues until:
   - The user types `/exit` or `/quit`.
   - The user presses Ctrl+D (EOF on stdin).
   - The user presses Ctrl+C twice within 1 second.
   - The agent terminates.

### 13.3 REPL Commands

The following slash commands are recognized within the REPL:

| Command | Description |
|---|---|
| `/exit`, `/quit` | End the session and exit. |
| `/abort` | Abort the current agent operation. |
| `/interrupt` | Send interrupt (SIGINT) to the agent. |
| `/pause` | Pause agent execution. |
| `/resume` | Resume paused execution. |
| `/status` | Print current run state, session ID, model, and cost. |
| `/cost` | Print accumulated cost for this run. |
| `/session` | Print the current session ID. |
| `/help` | Print REPL command reference. |

SDK frontends built on the same live-run surface can also defer follow-up
prompts with `RunHandle.queue()` and `RunHandle.steer()`. The bundled TUI maps
`/queue ...`, `/steer ...`, and `/steer-tool ...` onto those APIs when a run
is already active.

### 13.4 REPL + JSONL

When `-i` and `--json` are combined, the REPL reads prompts from stdin (one per line) and emits JSONL events to stdout. This enables programmatic multi-turn conversation. The REPL terminates on stdin EOF.

---

## 14. Pipe and Stdin Support

The CLI supports pipe-based workflows for composability with Unix tools.

### 14.1 Reading Prompt from Stdin

When `amux run` is invoked without a prompt argument and stdin is not a TTY, the entire stdin is read and used as the prompt:

```bash
echo "refactor this function" | amux run claude
cat prompt.txt | amux run gemini --json
git diff | amux run codex "review this diff"
```

When both a positional prompt and stdin are provided, the positional prompt takes precedence and stdin is ignored.

### 14.2 JSONL Output for Piping

JSONL output (`--json`) is designed for consumption by downstream tools:

```bash
# Extract only text deltas
amux run claude "explain X" --json | jq 'select(.type == "text_delta") | .delta'

# Monitor tool calls
amux run codex "fix tests" --json | jq 'select(.type | startswith("tool_"))'

# Extract final text
amux run gemini "summarize" --json | jq 'select(.type == "run_result") | .text'
```

### 14.3 TTY Detection

The CLI detects whether stdin and stdout are TTYs using `process.stdin.isTTY` and `process.stdout.isTTY`:

| stdin | stdout | Behavior |
|---|---|---|
| TTY | TTY | Full interactive mode: colors, spinners, approval prompts. |
| TTY | Pipe | Colors disabled, spinners disabled, approval prompts still on stderr. |
| Pipe | TTY | Prompt read from stdin pipe. Approval prompts on stderr. |
| Pipe | Pipe | Full non-interactive: `--json` implied if not set, approvals auto-denied. |

---

## 15. `amux cost` -- Cost Reporting

Aggregate and display cost data across runs.

### 15.1 Syntax

```
amux cost report [flags...]
```

### 15.2 Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--agent` | `AgentName` | All | Filter by agent. Repeatable. |
| `--since` | `string` | -- | Include runs after this time. ISO 8601 or relative. |
| `--until` | `string` | -- | Include runs before this time. |
| `--model` | `string` | -- | Filter by model. |
| `--tag` | `string` | -- | Filter by tag. Repeatable. |
| `--group-by` | `string` | `agent` | Group results: `agent`, `model`, `day`, `tag`. |
| `--json` | `boolean` | `false` | Output as JSON object. |

### 15.3 Output (Human Mode)

A formatted table showing cost breakdowns per grouping:

```
Cost Report (last 30 days)
──────────────────────────────────────────
Agent       Runs    Input$    Output$    Total
claude        42    $1.23      $3.45     $4.68
codex         15    $0.50      $1.20     $1.70
gemini         8    $0.10      $0.30     $0.40
──────────────────────────────────────────
Total         65    $1.83      $4.95     $6.78
```

### 15.4 API Mapping

| CLI | SDK |
|---|---|
| `amux cost report --agent claude --since 30d` | `mux.sessions.totalCost({ agent: 'claude', since: '30d' })` |
| `amux cost report --group-by model` | `mux.sessions.totalCost({ groupBy: 'model' })` |

---

## 16. `amux config` -- Configuration Management

Read, write, and validate agent configuration files through the unified `ConfigManager` interface. See `08-config-and-auth.md`, Section 2 for the full `ConfigManager` specification.

### 16.1 Syntax

```
amux config get <agent> [field] [--scope global|project] [--json]
amux config set <agent> <field> <value> [--scope global|project]
amux config schema <agent> [--json]
amux config validate <agent> [--json]
amux config mcp list <agent> [--json]
amux config mcp add <agent> [--scope global|project]
amux config mcp remove <agent> <server-name> [--scope global|project]
amux config reload [agent]
```

#### Common Config Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--scope` | `global \| project` | `merged` | Target a specific config file scope. `global` reads/writes only `~/.agent-mux/config.json` (or the agent's global config). `project` reads/writes only `.agent-mux/config.json` (or the agent's project config). When omitted, read commands return the merged result (project overrides global); write commands target the global file. |
| `--json` | flag | off | Output in JSON format (single object, not JSONL). Applies to all read/query subcommands. |

### 16.2 `amux config get <agent> [field]`

Read configuration for an agent. If `field` is omitted, prints the full merged config. If `field` is provided (dot-notation), prints only that field's value.

**API mapping:**

| CLI | SDK |
|---|---|
| `amux config get claude` | `mux.config.get('claude')` |
| `amux config get claude model` | `mux.config.getField('claude', 'model')` |
| `amux config get claude permissions.allow` | `mux.config.getField('claude', 'permissions.allow')` |

### 16.3 `amux config set <agent> <field> <value>`

Write a single field to the agent's native config file.

`<value>` is parsed as JSON if it starts with `{`, `[`, `"`, or is a number/boolean literal. Otherwise it is treated as a plain string.

**API mapping:** `mux.config.setField('claude', 'model', 'claude-sonnet-4-20250514')`.

**Error behavior:**
- Unknown agent: exit code 3 (`AGENT_NOT_FOUND`).
- Invalid field/value: exit code 2 (`VALIDATION_ERROR`).
- File write failure: exit code 7 (`CONFIG_ERROR`).
- Lock contention: exit code 7 (`CONFIG_LOCK_ERROR`), message indicates retry.

### 16.4 `amux config schema <agent>`

Print the configuration schema for an agent, showing all recognized fields, their types, defaults, and valid ranges.

**API mapping:** `mux.config.schema('claude')` returns `AgentConfigSchema`.

### 16.5 `amux config validate <agent>`

Validate the current config file(s) for an agent against the schema. Prints validation results: field-level errors and warnings.

**API mapping:** `mux.config.validate('claude', mux.config.get('claude'))` returns `ValidationResult`.

### 16.6 `amux config mcp list <agent>`

List MCP servers configured for an agent.

**API mapping:** `mux.config.getMcpServers('claude')` returns `McpServerConfig[]`.

### 16.7 `amux config mcp add <agent>`

Add an MCP server to the agent's config. The CLI prompts for server name, command, args, and environment variables interactively. In non-interactive mode (piped stdin), reads a JSON `McpServerConfig` from stdin.

**API mapping:** `mux.config.addMcpServer('claude', serverConfig)`.

**Error behavior:**
- Agent does not support MCP: exit code 6 (`CAPABILITY_ERROR`).
- Server name already exists: exit code 7 (`CONFIG_ERROR`).

### 16.8 `amux config mcp remove <agent> <server-name>`

Remove an MCP server from the agent's config by name.

**API mapping:** `mux.config.removeMcpServer('claude', 'my-server')`.

### 16.9 `amux config reload [agent]`

> **Spec-level addition:** This command is not in the scope document's CLI listing (scope §21) but is specified in `08-config-and-auth.md` Section 2 and Section 15.1. It maps to the `ConfigManager.reload()` method added by that spec.

Invalidate the config cache and re-read from disk. If `agent` is omitted, reloads all agents.

This is useful when external processes (the agent's own CLI, manual editing) have modified config files since the last read.

**API mapping:** `mux.config.reload('claude')` or `mux.config.reload()`.

### 16.10 Examples

```bash
# Read full config
amux config get claude

# Read single field
amux config get claude model

# Set a field
amux config set claude model claude-sonnet-4-20250514

# View schema
amux config schema codex

# Validate current config
amux config validate gemini

# List MCP servers
amux config mcp list claude

# Remove an MCP server
amux config mcp remove claude my-custom-server

# Reload after external edit
amux config reload claude
```

---

## 17. `amux profiles` -- Profile Management

Manage named `RunOptions` presets. Profiles are stored as JSON files in `~/.agent-mux/profiles/` (global) or `.agent-mux/profiles/` (project). See `02-run-options-and-profiles.md`, Section 10 for the full `ProfileManager` specification.

### 17.1 Syntax

```
amux profiles list [flags...]
amux profiles show <name>
amux profiles set <name> [run-flags...]
amux profiles delete <name> [flags...]
amux profiles apply <name>
```

### 17.2 `amux profiles list`

List all available profiles from both global and project directories.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--scope` | `string` | All | Filter by scope: `global`, `project`. |
| `--json` | `boolean` | `false` | Output as JSON array. |

**Output columns (human mode):**

| Column | Description |
|---|---|
| Name | Profile name. |
| Scope | `global` or `project`. |
| Agent | Default agent in profile, or `--`. |
| Model | Default model in profile, or `--`. |

**API mapping:** `mux.profiles.list({ scope })` returns `ProfileEntry[]`.

### 17.3 `amux profiles show <name>`

Display the resolved contents of a profile (merged global + project).

**API mapping:** `mux.profiles.show(name)` returns `ResolvedProfile`.

### 17.4 `amux profiles set <name> [run-flags...]`

Create or update a profile. The profile data is derived from the provided run flags. Any flag accepted by `amux run` (except per-run ephemeral flags) can be used.

**Per-run ephemeral flags that are rejected** (per `02-run-options-and-profiles.md`, Section 10.3):

`--cwd`, `--env`, `--run-id`, `--attach`, `--fork`, `--no-session`, `--project-id`, `--interactive`, `--quiet`.

> **Note:** `--system` and `--system-mode` are NOT rejected — `systemPrompt` and `systemPromptMode` are valid profile fields (spec 02 §10.2).

These flags correspond to `RunOptions` fields that are per-run ephemeral and excluded from profile storage: `cwd`, `env`, `runId`, `attachments`, `systemPrompt`, `systemPromptMode`, `forkSessionId`, `noSession`, `projectId`, plus CLI-only flags `--interactive` and `--quiet`.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--scope` | `string` | Auto | Target scope: `global` or `project`. Defaults to `project` if a project directory exists, otherwise `global`. |

**API mapping:** `mux.profiles.set(name, profileData, { scope })`.

**Examples:**

```bash
# Create a "fast" profile
amux profiles set fast --agent claude --model claude-sonnet-4-20250514 --yolo --max-turns 5

# Create a "careful" profile
amux profiles set careful --agent claude --thinking-effort high --deny

# Create global profile
amux profiles set shared-fast --scope global --agent gemini --max-tokens 4096
```

### 17.5 `amux profiles delete <name>`

Delete a profile.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--scope` | `string` | Both | Scope to delete from: `global`, `project`. If omitted, deletes from both. |

**API mapping:** `mux.profiles.delete(name, { scope })`.

### 17.6 `amux profiles apply <name>`

Resolve a profile and print the resulting `RunOptions` values. Does not start a run. Useful for previewing what a profile produces.

**API mapping:** `mux.profiles.apply(name)` returns `Partial<RunOptions>`.

### 17.7 Error Behavior

- Unknown profile: exit code 9 (`PROFILE_NOT_FOUND`).
- Invalid profile data: exit code 2 (`VALIDATION_ERROR`).

---

## 18. `amux auth` -- Authentication

Check and guide authentication state for agents. The CLI never writes credentials or modifies auth state -- it only inspects and provides guidance.

### 18.1 Syntax

```
amux auth check [agent]
amux auth setup <agent>
```

### 18.2 `amux auth check [agent]`

Check authentication state. If `agent` is omitted, checks all agents.

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--json` | `boolean` | `false` | Output as JSON. |

**Output (human mode, single agent):**

```
Agent:    claude
Status:   authenticated
Method:   api-key
Identity: user@example.com
Checked:  2025-01-15T10:30:00Z
```

**Output (human mode, all agents):**

| Agent | Status | Method | Identity |
|---|---|---|---|
| claude | authenticated | api-key | user@... |
| codex | unauthenticated | -- | -- |
| gemini | authenticated | oauth | user@... |
| ... | ... | ... | ... |

**API mapping:**

| CLI | SDK |
|---|---|
| `amux auth check claude` | `mux.auth.check('claude')` returns `AuthState` |
| `amux auth check` | `mux.auth.checkAll()` returns `Record<AgentName, AuthState>` |

### 18.3 `amux auth setup <agent>`

Print setup guidance for authenticating with an agent. Does not perform authentication itself.

**Output:** Structured guidance including:
- Required steps (numbered list).
- Environment variables to set.
- Commands to run.
- Documentation links.
- Platform-specific notes.

**API mapping:** `mux.auth.getSetupGuidance('claude')` returns `AuthSetupGuidance`.

### 18.4 Error Behavior

- Unknown agent: exit code 3 (`AGENT_NOT_FOUND`).
- `auth check` with unauthenticated result: exits with code 0 (the check succeeded; the result is "unauthenticated"). The status is reported in the output.

---

## 18b. `amux skill` -- Skill Management

File-convention only (no native harness command). Skills are folders containing
a `SKILL.md` plus assets, installed under per-harness conventions.

```bash
amux skill list <agent> [--global|--project]
amux skill add <agent> <source-folder> [--name <n>] [--force] [--global|--project]
amux skill remove <agent> <name> [--global|--project]
amux skill where <agent>
amux skill agents           # list supported harnesses
```

Supported harnesses: `claude`, `codex`, `cursor`, `opencode`, `gemini`, `copilot`.
Paths: `$HOME/.<agent>/skills/` (global) or `<cwd>/.<agent>/skills/` (project).

---

## 18c. `amux agent` -- Sub-agent Management

File-convention only. Copies agent definition files (markdown/yaml/json) into
per-harness sub-agent directories.

```bash
amux agent list <agent> [--global|--project]
amux agent add <agent> <source> [--name <n>] [--force] [--global|--project]
amux agent remove <agent> <name> [--global|--project]
amux agent where <agent>
amux agent agents           # list supported harnesses
```

Supported: `claude`, `claude-code`, `codex`, `cursor`, `opencode`.
Paths: `$HOME/.<agent>/agents/` (global) or `<cwd>/.<agent>/agents/` (project).

References:
- Claude: https://code.claude.com/docs/en/sub-agents
- Codex: https://developers.openai.com/codex/subagents#custom-agents

---

## 18d. `amux hooks` -- Hook Management

Manage hook registrations and dispatch. Backed by `HookConfigManager` in core.

```bash
amux hooks <agent> discover                      # native hook types
amux hooks <agent> list
amux hooks <agent> add <hookType> [--handler builtin|command|script] [--target <t>] [--id <id>] [--global]
amux hooks <agent> remove <id> [--global]
amux hooks <agent> set <id> [--priority N] [--enabled true|false] [--target <t>]
amux hooks <agent> handle <hookType>             # stdin JSON → dispatch → result
```

Storage: `$HOME/.amux/hooks.json` (global), `<cwd>/.amux/hooks.json` (project).

---

## 19. `amux init` -- Project Initialization

Create the `.agent-mux/` directory in the current working directory with default configuration.

### 19.1 Syntax

```
amux init [flags...]
```

### 19.2 Behavior

1. Creates `.agent-mux/` in the current directory (or the directory specified by `--project-dir`).
2. Creates `.agent-mux/config.json` with an empty object `{}`.
3. Creates `.agent-mux/profiles/` directory.
4. Prints confirmation to stdout.
5. If `.agent-mux/` already exists, prints a message and exits with code 0 (idempotent).

### 19.3 Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--json` | `boolean` | `false` | Output result as JSON. |

---

## 20. Signal Handling

The CLI handles process signals for graceful shutdown and run control.

### 20.1 Unix (macOS, Linux)

| Signal | Behavior |
|---|---|
| `SIGINT` (Ctrl+C) | First: sends `interrupt()` to the active `RunHandle`. The agent may handle this gracefully (stop current tool call, remain alive). Second within 1 second: sends `abort()` to force shutdown. Third or if no active run: exits immediately. |
| `SIGTERM` | Initiates graceful shutdown: sends `SIGINT` to all child processes, waits the grace period (default 5000ms), then sends `SIGKILL` to any remaining children. Exits with code 13 (`ABORTED`). |
| `SIGKILL` | Cannot be caught. OS terminates the process. Child processes receive `SIGKILL` via process group. |
| `SIGTSTP` (Ctrl+Z) | Sends `pause()` to the active `RunHandle`. |
| `SIGCONT` | Sends `resume()` to the active `RunHandle`. |

### 20.2 Windows

Windows does not have POSIX signals. The CLI uses alternative mechanisms:

| Event | Behavior |
|---|---|
| Ctrl+C | Handled via `process.on('SIGINT')` (Node.js emulation). Behavior matches Unix `SIGINT` above. |
| Ctrl+Break | Sends `abort()` to the active `RunHandle`. Equivalent to double-SIGINT on Unix. |
| Console close / `SIGTERM` | `process.on('SIGTERM')` triggers graceful shutdown. Child processes are terminated via `TerminateProcess` Win32 API after the grace period. |
| `SIGTSTP` / `SIGCONT` | Not available on Windows. Pause/resume is only available through REPL commands (`/pause`, `/resume`). |

### 20.3 Zombie Prevention

All spawned child processes are registered in a cleanup list. On Node.js `beforeExit` and `exit` events, the CLI sends `SIGKILL` (Unix) or `TerminateProcess` (Windows) to any still-running children. This prevents zombie processes.

The grace period for graceful shutdown is configurable via `AGENT_MUX_GRACE_PERIOD_MS` environment variable (default: 5000ms).

---

## 21. Environment Variables

The following environment variables are recognized by the CLI. CLI flags take precedence over environment variables.

| Variable | Type | Default | Description | Equivalent Flag |
|---|---|---|---|---|
| `AGENT_MUX_CONFIG_DIR` | `string` | `~/.agent-mux/` | Override global config directory. | `--config-dir` |
| `AGENT_MUX_PROJECT_DIR` | `string` | `.agent-mux/` | Override project config directory. | `--project-dir` |
| `AGENT_MUX_DEFAULT_AGENT` | `AgentName` | -- | Default agent when none is specified. | `--agent` (global) |
| `AGENT_MUX_GRACE_PERIOD_MS` | `number` | `5000` | Grace period in milliseconds before SIGKILL on shutdown. | -- |
| `NO_COLOR` | any | -- | Disable colored output when set to any non-empty value. See [no-color.org](https://no-color.org/). | `--no-color` |
| `DEBUG` | `string` | -- | When set to `amux` or `amux:*`, enables debug logging to stderr. | `--debug` |
| `FORCE_COLOR` | any | -- | Force colored output even when stdout is not a TTY. Overridden by `NO_COLOR` and `--no-color`. | -- |

### 21.1 Resolution Order

For any configuration value, the resolution order is (highest precedence first):

1. CLI flags (e.g., `--config-dir`).
2. Environment variables (e.g., `AGENT_MUX_CONFIG_DIR`).
3. Project config file (`.agent-mux/config.json`).
4. Global config file (`~/.agent-mux/config.json`).
5. Adapter defaults.

This mirrors the SDK resolution order defined in `01-core-types-and-client.md`, Section 4.1.1 and `02-run-options-and-profiles.md`, Section 7.

---

## 22. Shell Completion

The CLI provides shell completion scripts for interactive use.

### 22.1 Generating Completion Scripts

```bash
# Bash
amux --completions bash > ~/.local/share/bash-completion/completions/amux
# or
amux --completions bash >> ~/.bashrc

# Zsh
amux --completions zsh > ~/.zfunc/_amux
# or add to .zshrc: fpath=(~/.zfunc $fpath); autoload -Uz compinit; compinit

# Fish
amux --completions fish > ~/.config/fish/completions/amux.fish

# PowerShell
amux --completions powershell >> $PROFILE
```

### 22.2 Completion Scope

Completions are provided for:
- Top-level commands (`run`, `install`, `adapters`, `capabilities`, `models`, `plugin`, `mcp`, `sessions`, `cost`, `config`, `profiles`, `auth`, `init`).
- Subcommands (e.g., `plugin list`, `mcp install`, `config mcp add`).
- Flag names and their valid values (e.g., `--agent` completes to registered agent names, `--thinking-effort` completes to `low`, `medium`, `high`, `max`).
- Agent names (positional argument for many commands).
- Model IDs (for `--model` flag, dynamically queried from the model registry).
- Profile names (for `--profile` flag).

---

## 23. Error Output Format

### 23.1 Human-Readable Errors

In human mode, errors are printed to stderr with the following format:

```
error: <message>
  code: <ErrorCode>
  agent: <agent> (when applicable)
  hint: <actionable guidance> (when available)
```

Example:

```
error: Agent 'cursor' does not support native plugin CLI commands
  code: CAPABILITY_ERROR
  agent: cursor
  hint: Agents with native plugin CLI: claude, gemini, codex, copilot, opencode
```

### 23.2 JSON Errors

In JSON mode (`--json`), errors are emitted as a JSON object to stdout:

```json
{
  "ok": false,
  "error": {
    "code": "CAPABILITY_ERROR",
    "message": "Agent 'cursor' does not support native plugin CLI commands",
    "agent": "cursor",
    "recoverable": false
  }
}
```

### 23.3 JSONL Run Errors

During `amux run --json`, errors appear as typed events in the JSONL stream:

```jsonl
{"type":"error","runId":"01J...","agent":"claude","timestamp":1718000000000,"code":"AUTH_ERROR","message":"Authentication required","recoverable":false}
```

The `type` field matches the error event types defined in `04-agent-events.md`: `auth_error`, `rate_limit_error`, `context_exceeded`, `crash`, `error`.

### 23.4 Canonical Error Codes

All error codes used by the CLI are defined in `01-core-types-and-client.md`, Section 3.1:

| Error Code | Description |
|---|---|
| `CAPABILITY_ERROR` | Agent/model lacks required capability. |
| `VALIDATION_ERROR` | Input fails schema or range validation. |
| `AUTH_ERROR` | Authentication required but not configured. |
| `AGENT_NOT_FOUND` | No adapter registered for the agent name. |
| `AGENT_NOT_INSTALLED` | Adapter exists but CLI binary not on `$PATH`. |
| `AGENT_CRASH` | Agent subprocess terminated unexpectedly. |
| `SPAWN_ERROR` | Failed to spawn agent subprocess. |
| `TIMEOUT` | Run exceeded wall-clock timeout. |
| `INACTIVITY_TIMEOUT` | Run exceeded inactivity timeout. |
| `PARSE_ERROR` | Failed to parse agent output or file. |
| `CONFIG_ERROR` | Config file read/write/parse failure. |
| `CONFIG_LOCK_ERROR` | Advisory file lock acquisition failed. |
| `SESSION_NOT_FOUND` | Specified session does not exist. |
| `PROFILE_NOT_FOUND` | Specified profile does not exist. |
| `PLUGIN_ERROR` | Plugin operation failed. |
| `RATE_LIMITED` | Agent reported rate limiting. |
| `CONTEXT_EXCEEDED` | Agent's context window exceeded. |
| `ABORTED` | Run was aborted by user. |
| `INTERNAL` | Internal error in agent-mux. |

---

## 24. Platform-Specific Notes

### 24.1 Windows

- **Signal handling**: Windows lacks POSIX signals. See Section 20.2 for the alternative mechanisms used.
- **TTY detection**: `process.stdin.isTTY` and `process.stdout.isTTY` work correctly on Windows terminals (cmd.exe, PowerShell, Windows Terminal). ConPTY is used for PTY-based agents.
- **PTY support**: `node-pty` uses ConPTY on Windows 10 1809+ for agents requiring PTY (OpenClaw, some interactive modes).
- **Path handling**: All internal paths use forward slashes. CLI output uses the platform-native separator. Config file paths (`--config-dir`, `--project-dir`) accept both forward and backslashes on Windows.
- **Color support**: ANSI color codes are supported in Windows Terminal and PowerShell 7+. Legacy cmd.exe may not render colors correctly; `--no-color` is recommended in that environment.
- **Hermes on Windows**: Hermes requires WSL2 on Windows. The hermes adapter detects whether WSL2 is available and spawns hermes through `wsl` when running on native Windows. If WSL2 is not detected, the adapter reports `installed: false` with guidance to install WSL2.
- **omp on Windows**: omp has `partial` Windows support (see `agent-mux-scope.md`, Section 23). Some features may not work correctly on Windows.
- **Shell completion**: PowerShell completion is supported via `Register-ArgumentCompleter`. See Section 22.1.

### 24.2 macOS

- **Homebrew**: Several agents offer Homebrew install methods (`claude`, `opencode`). The `amux install` command prefers Homebrew on macOS when available.
- **Config paths**: Global config at `~/` (`$HOME`, typically `/Users/<user>/`).

### 24.3 Linux

- **XDG compliance**: Some agents store config in XDG-compliant locations (e.g., `~/.config/` for Gemini, Copilot, OpenCode). The adapters handle this transparently.
- **Config paths**: Global config at `~/` (`$HOME`, typically `/home/<user>/`).

---

## 25. Command Summary

Quick reference of all commands and their SDK method mappings.

| Command | Subcommand | SDK Method |
|---|---|---|
| `amux run` | -- | `mux.run()` |
| `amux install` | -- | `mux.adapters.installInstructions()` |
| `amux adapters` | `list` | `mux.adapters.list()` + `mux.adapters.installed()` |
| `amux adapters` | `detect` | `mux.adapters.detect()` |
| `amux capabilities` | -- | `mux.adapters.capabilities()` + `mux.models.model()` |
| `amux models` | `list` | `mux.models.catalog()` |
| `amux models` | `get` | `mux.models.model()` |
| `amux models` | `refresh` | `mux.models.refresh()` |
| `amux models` | `current` | `mux.config.getModelSelection()` + `mux.models.model()` |
| `amux models` | `set` | `mux.models.validate()` + `mux.config.setModelSelection()` |
| `amux plugin` | `list` | Native CLI delegation |
| `amux plugin` | `install` | Native CLI delegation |
| `amux plugin` | `uninstall` | Native CLI delegation |
| `amux plugin` | `update` | Native CLI delegation |
| `amux plugin` | `marketplace` | Native CLI delegation |
| `amux mcp` | `list` | `mux.mcp.list()` |
| `amux mcp` | `install` | `mux.mcp.install()` |
| `amux mcp` | `uninstall` | `mux.mcp.uninstall()` |
| `amux sessions` | `list` | `mux.sessions.list()` |
| `amux sessions` | `show` | `mux.sessions.export()` |
| `amux sessions` | `search` | `mux.sessions.search()` |
| `amux sessions` | `export` | `mux.sessions.export()` |
| `amux sessions` | `diff` | `mux.sessions.diff()` |
| `amux sessions` | `resume` | `mux.run({ sessionId })` |
| `amux sessions` | `fork` | `mux.run({ forkSessionId })` |
| `amux cost` | `report` | `mux.sessions.totalCost()` |
| `amux config` | `get` | `mux.config.get()` / `mux.config.getField()` |
| `amux config` | `set` | `mux.config.setField()` |
| `amux config` | `schema` | `mux.config.schema()` |
| `amux config` | `validate` | `mux.config.validate()` |
| `amux config` | `mcp list` | `mux.config.getMcpServers()` |
| `amux config` | `mcp add` | `mux.config.addMcpServer()` |
| `amux config` | `mcp remove` | `mux.config.removeMcpServer()` |
| `amux config` | `reload` | `mux.config.reload()` |
| `amux profiles` | `list` | `mux.profiles.list()` |
| `amux profiles` | `show` | `mux.profiles.show()` |
| `amux profiles` | `set` | `mux.profiles.set()` |
| `amux profiles` | `delete` | `mux.profiles.delete()` |
| `amux profiles` | `apply` | `mux.profiles.apply()` |
| `amux auth` | `check` | `mux.auth.check()` / `mux.auth.checkAll()` |
| `amux auth` | `setup` | `mux.auth.getSetupGuidance()` |
| `amux skill` | `list` / `add` / `remove` / `where` / `agents` | File-convention (copy into `.{agent}/skills/`) |
| `amux agent` | `list` / `add` / `remove` / `where` / `agents` | File-convention (copy into `.{agent}/agents/`) |
| `amux hooks` | `discover` / `list` / `add` / `remove` / `set` / `handle` | `HookConfigManager` (core) |
| `amux doctor` | -- | Capability / auth / runtime diagnostics |
| `amux tui` | -- | Launch interactive Ink UI (`@a5c-ai/agent-mux-tui`) |
| `amux init` | -- | `createClient()` + directory creation |

---

## 26. Version and Help

```bash
# Print version
amux --version
amux -V

# Print help
amux --help
amux -h

# Command-specific help
amux run --help
amux plugin --help
amux mcp --help
```

`--version` prints the package version of `@a5c-ai/agent-mux-cli` and exits with code 0.

`--help` prints the usage summary for the command or subcommand and exits with code 0. Help text includes a brief description, syntax, available flags, and examples.

---

## 27. Type Reference Summary

This section lists the key types referenced throughout the CLI spec and where they are defined.

| Type | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `ErrorCode` | `01-core-types-and-client.md` | 3.1 |
| `AgentMuxError` | `01-core-types-and-client.md` | 3.1 |
| `CapabilityError` | `01-core-types-and-client.md` | 3.2 |
| `ValidationError` | `01-core-types-and-client.md` | 3.3 |
| `GlobalConfig` | `01-core-types-and-client.md` | 4.1.2 |
| `ClientOptions` | `01-core-types-and-client.md` | 5.1.1 |
| `InstalledAgentInfo` | `01-core-types-and-client.md` | 5.3.1 |
| `InstallMethod` | `01-core-types-and-client.md` | 5.3.1 |
| `RunOptions` | `02-run-options-and-profiles.md` | 2 |
| `ProfileData` | `02-run-options-and-profiles.md` | 10.2 |
| `ProfileManager` | `02-run-options-and-profiles.md` | 10 |
| `RunHandle` | `03-run-handle-and-interaction.md` | 2 |
| `RunResult` | `03-run-handle-and-interaction.md` | 3 |
| `AgentEvent` | `04-agent-events.md` | 2 |
| `AgentCapabilities` | `06-capabilities-and-models.md` | 2 |
| `ModelCapabilities` | `06-capabilities-and-models.md` | 2 |
| `SessionManager`, `SessionSummary`, `Session` | `07-session-manager.md` | 2 |
| `ConfigManager`, `AgentConfig` | `08-config-and-auth.md` | 2 |
| `AuthManager`, `AuthState` | `08-config-and-auth.md` | 8 |
| `PluginManager`, `InstalledPlugin`, `PluginListing` | `09-plugin-manager.md` | 2 |
| `McpServerConfig` | `02-run-options-and-profiles.md` | 4 |
| `RetryPolicy` | `01-core-types-and-client.md` | 5.1.1 |
| `CostRecord`, `CostSummary` | `01-core-types-and-client.md` | 4.2.3 |

---

## Implementation Status (2026-04-12)

Five command surfaces have landed that extend the original spec. All are implemented under `packages/cli/src/commands/`.

### `amux install <agent> [--version V] [--force] [--dry-run] [--json]`

Invokes the adapter's `install()`. Emits an `InstallResult`. Non-zero exit if `ok` is false. Used by the Dockerfile with `HARNESSES=<csv>` to pre-install harnesses into an image.

### `amux update <agent> [--dry-run] [--json]`

Invokes the adapter's `update()`. Same result shape.

### `amux detect [<agent> | --all] [--json]`

Invokes `detectInstallation()`. With `--all` iterates every registered adapter; with a specific agent returns one record. Prints `installed`, `version`, `path`, `notes`.

### `amux detect-host [--json]`

Calls `client.detectHost()` and prints `HostHarnessInfo { agent, confidence, source, matchedSignals }` or "no harness detected". Confidence: `high` (≥ 2 env signals), `medium` (1 env signal), `low` (argv heuristic only).

### `amux remote install|update <host> [--mode ssh|docker|k8s|local] [--harness <agent>] [--force] [--json]`

Four-step bootstrap over the chosen invocation mode:

1. Probe `amux --version` on target.
2. If missing or `update`/`--force`: `npm install -g @a5c-ai/agent-mux-cli` (or `npm update -g`).
3. `amux install <harness>` (or `amux update <harness>`) on target.
4. Verify with `amux detect --all --json`.

Default `--mode` is `ssh` when `<host>` is given, else `local`. Default `--harness` is `claude-code`.

### Global flags actually accepted

From `packages/cli/src/parse-args.ts` the recognized globals are: `--agent/-a`, `--model/-m`, `--json`, `--debug`, `--config-dir`, `--project-dir`, `--no-color`, `--version/-V`, `--help/-h`, `--completions <shell>`. The top-level commands: `run`, `install`, `uninstall`, `update`, `detect`, `detect-host`, `remote`, `adapters`, `capabilities`, `models`, `plugin`, `mcp`, `sessions`, `cost`, `config`, `profiles`, `auth`, `init`, `version`, `help`.
