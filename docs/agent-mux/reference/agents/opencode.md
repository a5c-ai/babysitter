# OpenCode

Adapters for the **OpenCode** multi-provider AI coding agent from [anomalyco/opencode](https://github.com/anomalyco/opencode).

⚠️ **Important**: This is **not** the same as the deprecated `opencode-ai/opencode` project (now `charmbracelet/crush`). Agent-mux specifically supports the `anomalyco/opencode` implementation.

## Adapter Variants

Agent-mux provides two OpenCode adapters:

- **`opencode`** (subprocess) — Default CLI-based integration
- **`opencode-http`** (remote) — HTTP server with SSE streaming for enhanced performance

### Choosing an Adapter

| Adapter | Type | Use Case | Performance |
|---------|------|----------|-------------|
| `opencode` | Subprocess | General use, simple setup | Standard |
| `opencode-http` | Remote (HTTP) | High-performance, real-time streaming | Enhanced |

**Recommendation**: Use `opencode-http` for production workloads or when performance is critical. Use `opencode` for simple use cases or debugging.

## Install

```bash
# Install the CLI (required for both adapters)
amux install opencode
```

Install methods:
- npm: `npm install -g @anomalyco/opencode`
- brew (macOS): `brew install --cask opencode`
- curl: `curl -fsSL https://opencode.ai/install | bash`

Supported on macOS, Linux and Windows.

## Auth

OpenCode supports multiple AI providers. Configure authentication using:

```bash
opencode auth
```

Or set environment variables directly:
- `ANTHROPIC_API_KEY` — for Claude models
- `OPENAI_API_KEY` — for GPT models  
- `GOOGLE_API_KEY` — for Gemini models

Config file: `~/.config/opencode/config.json`.

## Minimal run

### CLI Examples

```bash
# Subprocess adapter (default)
amux run opencode --prompt "Add error handling to this function"

# HTTP adapter (enhanced performance)
amux run opencode-http --prompt "Add error handling to this function"
```

### Programmatic Examples

```ts
import { createClient } from '@a5c-ai/agent-mux';
const client = createClient();

// Subprocess adapter
const handle1 = await client.run({ agent: 'opencode', prompt: 'Refactor this code' });
for await (const ev of handle1.events()) console.log(ev);

// HTTP adapter
const handle2 = await client.run({ agent: 'opencode-http', prompt: 'Refactor this code' });
for await (const ev of handle2.events()) console.log(ev);
```

## Notable flags

The adapter forwards these `RunOptions` to the CLI:

- `--format json` (always, for structured output parsing)
- `--model <id>` — e.g. `claude-3-5-sonnet-20241022` or `gpt-4o`
- `--session <id>` — create or resume a session
- `--continue` — continue an existing session
- `--fork <id>` — fork from an existing session
- `--max-turns <n>` — limit conversation length
- `--system <prompt>` — set system prompt

## Session files

- Location: `~/.config/opencode/sessions/*.jsonl`
- Format: JSONL with OpenCode event structure
- Resume and fork are both supported (`canResume`, `canFork`)

## Plugins

Plugin support: **yes** — MCP server integration.

### MCP Servers
```bash
amux mcp install opencode <mcp-server>
amux mcp list opencode
```

Registry: https://modelcontextprotocol.io for MCP servers.

## Models

OpenCode supports multiple AI providers:

| Model ID | Provider | Context | Notes |
|----------|----------|---------|-------|
| `claude-3-5-sonnet-20241022` | Anthropic | 200k | Default model |
| `gpt-4o` | OpenAI | 128k | Alternative option |

Additional models available via provider configuration.

## Capabilities

### Shared Capabilities (both adapters)

- **Text streaming** with real-time output
- **Tool calling** with parallel execution support
- **JSON mode** and structured output
- **Image input** and file attachments
- **Multi-turn conversations** with session persistence
- **Subagent dispatch** (up to 5 parallel tasks)
- **Interactive mode** with stdin injection
- **Skills** and `AGENTS.md` support
- **MCP server** plugin integration

### HTTP Adapter Enhancements (`opencode-http`)

- **Server-Sent Events (SSE)** streaming for reduced latency
- **HTTP REST API** for direct integration
- **Automatic server management** with health monitoring
- **Enhanced connection pooling** for multiple concurrent sessions

## HTTP Adapter Details

The `opencode-http` adapter manages an OpenCode server automatically:

### Server Management
- **Automatic startup**: Server starts via `opencode serve` when first connection is made
- **Health monitoring**: Regular health checks ensure server availability
- **Graceful shutdown**: Server cleanup on adapter disposal
- **Port management**: Automatic port allocation to avoid conflicts

### Connection Details
- **Endpoint**: Typically `http://localhost:<dynamic-port>`
- **SSE Streaming**: `/api/chat/stream` endpoint for real-time events
- **Authentication**: Inherits OpenCode's configured auth providers
- **Session persistence**: Maintains session state across requests

### When to Use
- **High throughput**: Multiple concurrent conversations
- **Low latency**: Direct HTTP eliminates subprocess overhead
- **Integration**: REST API for custom tooling
- **Production**: Enhanced reliability and monitoring

## Known limitations

### Both Adapters
- **No thinking streams** — OpenCode doesn't expose internal reasoning
- **No image output** — text-only responses
- **Tool approval required** — use `approvalMode: 'yolo'` to auto-approve in trusted environments

### Subprocess Adapter (`opencode`)
- **No PTY support** — runs in standard subprocess mode

### HTTP Adapter (`opencode-http`)
- **Server dependency** — requires successful `opencode serve` startup
- **Port requirements** — needs available TCP port for server
