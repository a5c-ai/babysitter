# `amux launch` — Unified Harness Launcher

> Archived design document. Preserved for historical context; not part of the current normative `reference/` contract.

**Specification v1.0** | `@a5c-ai/agent-mux-cli`

---

## 1. Overview

`amux launch` is a CLI command that launches (or resumes) an interactive or non-interactive coding agent session with full stdin/stdout passthrough. Unlike `amux run`, which parses and normalizes agent output into the `AgentEvent` stream, `amux launch` acts as a **transparent proxy** — the user interacts directly with the harness as if they invoked it natively.

The key differentiation:

| Concern | `amux run` | `amux launch` |
|---|---|---|
| Output format | Normalized `AgentEvent` stream | Raw harness output (bypass) |
| Input format | `RunOptions` / SDK API | Raw stdin passthrough |
| Provider config | N/A (each harness's own) | Unified provider/model resolution |
| Proxy orchestration | No | Yes (`--with-proxy-if-needed`) |
| Use case | Programmatic orchestration, multi-agent | Direct harness usage with provider flexibility |

### 1.1 Cross-References

| Concept | Spec |
|---|---|
| Provider/model configuration | `docs/amux-provider-config.md` |
| `amux-proxy` bridge package | `docs/provider-mux.md` |
| Adapter system | `05-adapter-system.md` |
| Built-in adapters | `12-built-in-adapters.md` |
| CLI reference | `10-cli-reference.md` |
| Process lifecycle | `11-process-lifecycle-and-platform.md` |

---

## 2. Command Syntax

```
amux launch <harness> [provider] [flags...]
```

### 2.1 Positional Arguments

| Argument | Required | Description |
|---|---|---|
| `<harness>` | Yes | Target harness name. Must be a registered `SubprocessAdapter.agent` value: `claude`, `codex`, `gemini`, `opencode`, `copilot`, `cursor`, `pi`, `omp`, `openclaw`, `hermes`, `droid`, `amp`, `qwen` |
| `[provider]` | No | Provider/backend identifier. If omitted, uses the harness's default native provider. See §3 for the full taxonomy. |

### 2.2 Flags

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
| `--transport` | `-t` | `string` | Wire protocol the harness should speak. One of: `anthropic`, `openai-chat`, `openai-responses`, `google`. Default: auto-detected from harness+provider. |
| `--profile` | | `string` | Named provider profile from `~/.amux/providers.json`. |
| `--auth-command` | | `string` | External command that emits a bearer token on stdout. |

#### Proxy Control

| Flag | Type | Default | Description |
|---|---|---|---|
| `--with-proxy-if-needed` | `boolean` | `false` | Launch `amux-proxy` automatically if the harness cannot speak the provider's native transport directly. |
| `--with-proxy` | `boolean` | `false` | Force proxy launch even if the harness supports the provider natively. Useful for observability/logging. |
| `--no-proxy` | `boolean` | `false` | Explicitly disable proxy. Error if the harness cannot reach the provider without one. |
| `--proxy-port` | `number` | `0` (auto) | Port for the proxy server. `0` = ephemeral port. |
| `--proxy-log-level` | `string` | `warn` | Log level for the proxy process: `debug`, `info`, `warn`, `error`. |

#### Session Control

| Flag | Short | Type | Description |
|---|---|---|---|
| `--resume` | `-r` | `string` | Resume an existing session by ID or name. Passes the appropriate resume flag to the harness. |
| `--session-id` | `-s` | `string` | Explicit session ID for a new session. |

#### Execution Mode

| Flag | Short | Type | Description |
|---|---|---|---|
| `--prompt` | `-p` | `string` | Initial prompt. If set, runs in **non-interactive** mode: sends the prompt, streams output, and exits when the harness exits. If omitted, runs in **interactive** mode with full stdin/stdout passthrough. |
| `--max-turns` | | `number` | Turn limit (non-interactive mode). |
| `--max-budget-usd` | | `number` | Cost limit (where harness supports it). |

#### Harness Passthrough

| Flag | Type | Description |
|---|---|---|
| `--harness-args` | `string[]` | Raw arguments forwarded verbatim to the harness CLI after all amux-managed args. Use `--` separator: `amux launch claude api -- --bare --verbose` |

#### General

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--json` | | `boolean` | `false` | Output machine-readable JSON for launch status and proxy lifecycle events (does not affect harness output). |
| `--debug` | `-d` | `boolean` | `false` | Debug mode. Logs proxy and harness process details. |
| `--dry-run` | | `boolean` | `false` | Print the resolved command, env vars, and proxy config without executing. |

---

## 3. Provider Taxonomy

Providers are organized into categories. Each provider implies a specific wire transport protocol and authentication mechanism.

### 3.1 Provider Categories

| Category | Provider IDs | Wire Protocol | Auth Mechanism |
|---|---|---|---|
| **Direct API** | `api` | Provider-native | API key |
| **Cloud (AWS)** | `bedrock` | Bedrock Converse / Anthropic Messages | AWS IAM / STS / Profile |
| **Cloud (GCP)** | `vertex` | Vertex AI / Google GenAI | ADC / Service Account / OAuth |
| **Cloud (Azure)** | `azure`, `foundry` | Azure OpenAI / Foundry | API key / AD token / SPN |
| **OAuth** | `oauth` | Provider-native | OAuth2 browser flow |
| **Local** | `local`, `ollama` | OpenAI Chat / Responses | None (localhost) |
| **Custom** | `custom` | Any (requires `--transport`) | Any (via flags) |

### 3.2 Provider ↔ Harness Native Support Matrix

This matrix defines which harness/provider combinations work **without** a proxy:

| | `api` | `bedrock` | `vertex` | `azure` | `foundry` | `oauth` | `local` | `ollama` |
|---|---|---|---|---|---|---|---|---|
| **claude** | ✅ Anthropic | ✅ Built-in | ✅ Built-in | ❌ | ✅ Built-in | ✅ Browser | ❌ | ⚠️ via `ANTHROPIC_BASE_URL` |
| **codex** | ✅ OpenAI | ❌ | ❌ | ❌ | ❌ | ✅ `codex login` | ❌ | ✅ `--oss` / config.toml |
| **gemini** | ✅ Google | ❌ | ✅ ADC | ❌ | ❌ | ✅ Browser | ❌ | ❌ |
| **opencode** | ✅ Multi | ✅ SDK | ✅ SDK | ✅ SDK | ❌ | ❌ | ❌ | ⚠️ OpenAI-compat |
| **copilot** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ GitHub | ❌ | ❌ |
| **cursor** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

Legend: ✅ = native support, ⚠️ = works with env var hack, ❌ = not supported (proxy required)

### 3.3 Transport Protocol Registry

| Transport ID | Description | Endpoint Format | Used By |
|---|---|---|---|
| `anthropic` | Anthropic Messages API | `POST /v1/messages` (SSE streaming) | Claude Code |
| `openai-chat` | OpenAI Chat Completions | `POST /v1/chat/completions` | Codex (wire_api=chat), OpenCode |
| `openai-responses` | OpenAI Responses API | `POST /v1/responses` | Codex (wire_api=responses) |
| `google` | Google GenerateContent | `POST /v1beta/models/:model:generateContent` | Gemini CLI |

---

## 4. Launch Resolution Algorithm

When `amux launch <harness> [provider] [flags]` is invoked, the following resolution steps execute in order:

### Step 1: Validate Harness

```
1. Look up <harness> in AdapterRegistry
2. If not found → error: "Unknown harness '<harness>'. Available: <list>"
3. Verify adapter is SubprocessAdapter type
4. If not subprocess → error: "Harness '<harness>' is a <type> adapter and cannot be launched via CLI"
```

### Step 2: Resolve Provider

```
1. If <provider> is given, resolve from provider taxonomy (§3.1)
2. If --profile is given, load profile from ~/.amux/providers.json, merge with flags
3. If neither, use harness default:
   - claude → api (Anthropic)
   - codex → api (OpenAI)
   - gemini → api (Google)
   - opencode → infer from env vars
4. Validate required auth for provider (--api-key, env vars, or --auth-command)
```

### Step 3: Resolve Transport

```
1. If --transport is explicit, use it
2. Otherwise, infer from harness native protocol:
   - claude → anthropic
   - codex → openai-responses (or openai-chat if configured)
   - gemini → google
   - opencode → openai-chat
3. Record resolved transport as T_harness
4. Record provider's native transport as T_provider
```

### Step 4: Determine Proxy Necessity

```
1. Check native support matrix (§3.2) for (harness, provider) pair
2. If natively supported:
   a. If --with-proxy → proxy = FORCE (user wants it anyway)
   b. If --no-proxy → proxy = SKIP
   c. Otherwise → proxy = SKIP (redundant, skip for performance)
   d. Log: "Proxy not needed: <harness> speaks <provider> natively"
3. If NOT natively supported:
   a. If --no-proxy → error: "<harness> does not support <provider> natively.
      Use --with-proxy-if-needed or configure the harness manually."
   b. If --with-proxy-if-needed or --with-proxy → proxy = REQUIRED
   c. Otherwise → error: "<harness> requires a proxy for <provider>.
      Use --with-proxy-if-needed to auto-launch the proxy."
```

### Step 5: Launch Proxy (if needed)

```
1. Resolve proxy port (--proxy-port or ephemeral)
2. Build proxy configuration:
   - target_provider: provider config (model, api_key, region, project, etc.)
   - exposed_transport: T_harness (what the harness expects to speak)
   - port: resolved port
3. Spawn amux-proxy process (see docs/provider-mux.md §5)
4. Wait for proxy health check (GET /health → 200)
5. Record proxy URL as PROXY_BASE_URL = http://127.0.0.1:<port>
6. If proxy fails to start within 15s → error + cleanup
```

### Step 6: Build Harness Environment

Based on harness identity and whether proxy is active, construct the environment variables and CLI args.

#### Claude Code

```bash
# Direct (no proxy, api provider)
ANTHROPIC_API_KEY=<key>
ANTHROPIC_MODEL=<model>  # if --model given
claude [session-flags] [harness-args]

# Via proxy
ANTHROPIC_BASE_URL=http://127.0.0.1:<port>
ANTHROPIC_API_KEY="amux-proxy"
ANTHROPIC_AUTH_TOKEN="amux-proxy"
claude [session-flags] [harness-args]

# Bedrock (native)
CLAUDE_CODE_USE_BEDROCK=1
AWS_REGION=<region>
AWS_ACCESS_KEY_ID=<key>  # or use profile
claude [session-flags] [harness-args]

# Vertex (native)
CLAUDE_CODE_USE_VERTEX=1
GOOGLE_CLOUD_PROJECT=<project>
GOOGLE_CLOUD_LOCATION=<region>
claude [session-flags] [harness-args]
```

#### Codex

```bash
# Direct (no proxy, api provider)
OPENAI_API_KEY=<key>
codex [exec] [session-flags] [harness-args]

# Via proxy (proxy exposes OpenAI Responses API)
OPENAI_BASE_URL=http://127.0.0.1:<port>
OPENAI_API_KEY="amux-proxy"
codex [exec] [session-flags] [harness-args]

# Ollama (native)
codex --oss [session-flags] [harness-args]
```

#### Gemini CLI

```bash
# Direct (no proxy, api provider)
GEMINI_API_KEY=<key>
gemini [--prompt <prompt>] [harness-args]

# Vertex (native)
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=<project>
GOOGLE_CLOUD_LOCATION=<region>
gemini [--prompt <prompt>] [harness-args]

# Via proxy (proxy exposes Google GenerateContent)
CODE_ASSIST_ENDPOINT=http://127.0.0.1:<port>
GEMINI_API_KEY="amux-proxy"
gemini [--prompt <prompt>] [harness-args]
```

#### OpenCode

```bash
# Direct (any supported provider)
OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json","provider":{"resolved":{"npm":"@ai-sdk/anthropic","options":{}}},"model":{"default":"resolved/<model>"}}'
opencode [session-flags] [harness-args]

# Via proxy (proxy exposes OpenAI Chat Completions)
OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json","provider":{"amux-proxy":{"npm":"@ai-sdk/openai-compatible","options":{"baseURL":"http://127.0.0.1:<port>/v1"}}},"model":{"default":"amux-proxy/<model>"}}'
opencode [session-flags] [harness-args]
```

### Step 7: Spawn Harness Process

```
1. Resolve full command + args for the harness
2. If --prompt is set:
   a. Inject prompt via harness-specific mechanism:
      - claude: --print <prompt> (or stdin stream-json message)
      - codex: codex exec <prompt>
      - gemini: --prompt <prompt>
      - opencode: (stdin after launch)
   b. Set nonInteractive = true
3. If --resume is set:
   a. Pass harness-specific resume flag:
      - claude: --resume <id>
      - codex: codex resume <id>
      - gemini: (not supported → error)
      - opencode: --session <id>
4. Spawn child process with:
   - stdin: process.stdin (passthrough)
   - stdout: process.stdout (passthrough)
   - stderr: process.stderr (passthrough)
   - env: merged (process.env + harness env + proxy env)
   - cwd: process.cwd()
5. Wire SIGINT, SIGTERM, SIGHUP to child process
6. Register cleanup handler for proxy (if running)
```

### Step 8: Cleanup on Exit

```
1. On child process exit:
   a. If proxy is running:
      - Send SIGTERM to proxy
      - Wait up to 5s for graceful shutdown
      - SIGKILL if needed
   b. Forward child exit code as amux exit code
2. On SIGINT/SIGTERM to amux:
   a. Forward signal to child
   b. Wait for child exit
   c. Clean up proxy
   d. Exit with child's code (or 130 for SIGINT)
```

---

## 5. Interactive vs Non-Interactive Mode

### 5.1 Interactive Mode (default)

When no `--prompt` flag is given:

- stdin, stdout, and stderr are passed through directly to the harness
- amux does **not** parse or transform the output
- The user interacts with the harness TUI natively
- amux only manages the proxy lifecycle and process signals
- PTY allocation follows the harness's native preference (most harnesses need a PTY for their TUI)

```bash
# Interactive Claude Code session via Bedrock
amux launch claude bedrock --region us-east-1 --with-proxy-if-needed

# Interactive Codex session with a custom provider
amux launch codex custom --api-base https://my-llm.corp.net --api-key $KEY --transport openai-responses
```

### 5.2 Non-Interactive Mode

When `--prompt` is given:

- The prompt is delivered to the harness via its native mechanism
- stdout and stderr are still passed through (no AgentEvent normalization)
- The process exits when the harness completes its response
- Suitable for scripting and CI/CD pipelines

```bash
# One-shot Claude via Vertex
amux launch claude vertex --project my-project --region us-central1 \
  -p "Explain the authentication flow in this codebase" \
  --max-turns 3

# One-shot Codex via Bedrock (needs proxy: Codex speaks OpenAI, Bedrock speaks Anthropic)
amux launch codex bedrock --region us-west-2 --model anthropic.claude-sonnet-4 \
  --with-proxy-if-needed \
  -p "Fix the failing test in src/auth.ts"
```

---

## 6. Dry Run Output

`--dry-run` prints the resolved launch plan as JSON and exits:

```json
{
  "harness": "claude",
  "provider": "bedrock",
  "transport": "anthropic",
  "model": "anthropic.claude-sonnet-4-20250514-v1:0",
  "proxyNeeded": false,
  "proxyReason": "claude supports bedrock natively via CLAUDE_CODE_USE_BEDROCK",
  "command": "claude",
  "args": ["--print", "--output-format", "stream-json", "--model", "claude-sonnet-4-20250514"],
  "env": {
    "CLAUDE_CODE_USE_BEDROCK": "1",
    "AWS_REGION": "us-east-1"
  },
  "harnessArgs": []
}
```

When proxy is needed:

```json
{
  "harness": "codex",
  "provider": "bedrock",
  "transport": "openai-responses",
  "model": "anthropic.claude-sonnet-4-20250514-v1:0",
  "proxyNeeded": true,
  "proxyReason": "codex does not support bedrock natively; proxy bridges bedrock → openai-responses",
  "proxy": {
    "targetProvider": "bedrock",
    "targetModel": "anthropic.claude-sonnet-4-20250514-v1:0",
    "exposedTransport": "openai-responses",
    "port": 0,
    "command": "amux-proxy",
    "env": {
      "AMUX_PROXY_TARGET_PROVIDER": "bedrock",
      "AMUX_PROXY_TARGET_MODEL": "anthropic.claude-sonnet-4-20250514-v1:0",
      "AMUX_PROXY_EXPOSED_TRANSPORT": "openai-responses",
      "AMUX_PROXY_PORT": "0",
      "AWS_REGION": "us-east-1"
    }
  },
  "command": "codex",
  "args": ["exec"],
  "env": {
    "OPENAI_BASE_URL": "http://127.0.0.1:<resolved-port>",
    "OPENAI_API_KEY": "amux-proxy"
  },
  "harnessArgs": []
}
```

---

## 7. Error Catalog

| Code | Condition | Message Template |
|---|---|---|
| `HARNESS_NOT_FOUND` | Unknown harness name | `Unknown harness '{name}'. Available: {list}` |
| `HARNESS_NOT_INSTALLED` | Harness binary not in PATH | `{harness} is not installed. Install with: {installCommand}` |
| `PROVIDER_UNSUPPORTED` | Harness+provider combo not feasible | `{harness} cannot use provider '{provider}' (no native support and proxy not enabled)` |
| `PROXY_REQUIRED` | Harness needs proxy but `--no-proxy` set | `{harness} requires a proxy for {provider}. Remove --no-proxy or use --with-proxy-if-needed` |
| `PROXY_LAUNCH_FAILED` | amux-proxy failed to start | `Failed to launch proxy: {error}. Is amux-proxy installed? (pip install amux-proxy)` |
| `PROXY_HEALTH_TIMEOUT` | Proxy didn't become healthy | `Proxy health check timed out after 15s on port {port}` |
| `AUTH_MISSING` | Required auth not provided | `Provider '{provider}' requires authentication. Set {envVar} or use --api-key` |
| `TRANSPORT_MISMATCH` | Explicit --transport not feasible | `Transport '{transport}' is not available for {harness}+{provider}` |
| `RESUME_NOT_SUPPORTED` | Harness doesn't support resume | `{harness} does not support session resumption` |
| `MODEL_NOT_SPECIFIED` | Provider requires explicit model | `Provider '{provider}' requires --model to be specified` |

---

## 8. Relationship to `amux run`

`amux launch` and `amux run` are complementary:

| | `amux launch` | `amux run` |
|---|---|---|
| **Primary user** | Humans, scripts wanting raw harness UX | Applications, orchestrators, multi-agent systems |
| **Output** | Raw harness output (bypass) | Normalized `AgentEvent` stream |
| **Provider flexibility** | Full (any provider via proxy) | Limited to harness native |
| **Session management** | Delegates to harness | Managed by agent-mux SessionManager |
| **Cost tracking** | Delegated to harness | Tracked by agent-mux |
| **Hooks** | Not fired (bypass) | Full hook lifecycle |
| **Multi-agent** | Single harness only | Dispatch across multiple agents |

A future enhancement could add `--observe` to `amux launch` that tees the harness output to both stdout (raw) and an internal parser (for cost tracking and session recording), without transforming the user-facing output.

---

## 9. Implementation Notes

### 9.1 Package Location

The `launch` command is implemented in `packages/cli/src/commands/launch.ts` as part of the existing `@a5c-ai/agent-mux-cli` package. It reuses:

- `AdapterRegistry` for harness lookup and capability checking
- `BaseAgentAdapter.detectInstallation()` for binary discovery
- `BaseAgentAdapter.detectAuth()` for auth validation
- Provider resolution from `@a5c-ai/agent-mux-core` (new module: `provider-config.ts`)

### 9.2 Proxy Process Management

The proxy is spawned as a detached child process with stdio set to `pipe` (not inherited). Its stdout/stderr are captured and logged at the `--proxy-log-level`. The proxy PID is tracked via `ProcessTracker` for cleanup guarantees.

### 9.3 Signal Handling

On Windows, `SIGINT` is not reliable for child processes. The launcher uses `process.kill(child.pid, 'SIGTERM')` and falls back to `taskkill /PID <pid> /F` after timeout.

### 9.4 PTY Allocation

Interactive mode allocates a PTY for harnesses that require it (most TUI-based harnesses). The `node-pty` library is used, matching the existing `SpawnRunner` implementation. Non-interactive mode uses plain pipes.
