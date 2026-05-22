# amux-proxy

`amux-proxy` is a lightweight Python service that bridges LLM transport protocols. It accepts requests in one wire format — the format a coding agent harness expects — and forwards them to any LLM provider supported by [LiteLLM](https://github.com/BerriAI/litellm), translating between the two. This lets vendor-locked harnesses such as Claude Code (Anthropic protocol), Codex (OpenAI Responses protocol), and Gemini CLI (Google GenerateContent protocol) use any backend: AWS Bedrock, Google Vertex AI, Ollama, Groq, Together AI, DeepSeek, and 140+ others.

`amux-proxy` is designed to be spawned on-demand by `amux launch --with-proxy-if-needed` and shut down when the harness exits. It can also run as a persistent service.

Full documentation: [docs/provider-mux.md](../../docs/provider-mux.md)

---

## Installation

```bash
# Standard install
pip install amux-proxy

# With local Ollama model management support
pip install "amux-proxy[ollama]"
```

Requires Python 3.11 or later.

---

## Quick Start

### Example 1: Claude Code pointing at AWS Bedrock

Claude Code speaks the Anthropic Messages API natively. `amux-proxy` exposes the same Anthropic API surface and forwards requests to Bedrock under the hood.

```bash
AMUX_PROXY_TARGET_PROVIDER=bedrock \
AMUX_PROXY_TARGET_MODEL="bedrock/anthropic.claude-sonnet-4-20250514-v1:0" \
AMUX_PROXY_EXPOSED_TRANSPORT=anthropic \
AWS_REGION_NAME=us-east-1 \
amux-proxy --port 8080

# Then launch Claude Code against the proxy
ANTHROPIC_BASE_URL=http://127.0.0.1:8080 \
ANTHROPIC_API_KEY=<token printed by proxy on startup> \
claude
```

### Example 2: Codex (OpenAI Responses API) pointing at Google Vertex AI

Codex speaks the OpenAI Responses API. `amux-proxy` exposes `/v1/responses` and routes to Vertex AI.

```bash
amux-proxy \
  --target-provider vertex_ai \
  --target-model "vertex_ai/claude-sonnet-4@20250514" \
  --transport openai-responses \
  --port 8080

# Then launch Codex against the proxy
OPENAI_BASE_URL=http://127.0.0.1:8080 \
OPENAI_API_KEY=<token printed by proxy on startup> \
codex
```

### Example 3: Claude Code pointing at a local Ollama instance

```bash
# With Ollama support installed
pip install "amux-proxy[ollama]"

amux-proxy \
  --target-provider ollama \
  --target-model "ollama/qwen3:32b" \
  --transport anthropic \
  --port 8080

# amux-proxy auto-pulls qwen3:32b if it is not already available locally.
# Then launch Claude Code against the proxy
ANTHROPIC_BASE_URL=http://127.0.0.1:8080 \
ANTHROPIC_API_KEY=<token printed by proxy on startup> \
claude
```

All three examples are also orchestrated automatically by `amux launch --with-proxy-if-needed` from the `@a5c-ai/agent-mux-cli` package.

---

## Environment Variables

All configuration is via environment variables. CLI flags (`--target-provider`, `--target-model`, `--transport`, etc.) take precedence over env vars of the same name.

### Core (required)

| Variable | Description | Example |
|---|---|---|
| `AMUX_PROXY_TARGET_PROVIDER` | LiteLLM provider prefix for the backend | `bedrock`, `vertex_ai`, `anthropic`, `ollama`, `groq` |
| `AMUX_PROXY_TARGET_MODEL` | Model identifier in LiteLLM format | `bedrock/anthropic.claude-sonnet-4-20250514-v1:0` |
| `AMUX_PROXY_EXPOSED_TRANSPORT` | Wire format to expose to the harness | `anthropic`, `openai-chat`, `openai-responses`, `google` |

### Network

| Variable | Default | Description |
|---|---|---|
| `AMUX_PROXY_PORT` | `0` (OS-assigned) | Port to listen on. `0` lets the OS assign an ephemeral port, which is printed to stdout on startup. |
| `AMUX_PROXY_HOST` | `127.0.0.1` | Bind address. Change to `0.0.0.0` only when running in an isolated container. |

### Auth

| Variable | Default | Description |
|---|---|---|
| `AMUX_PROXY_AUTH_TOKEN` | (auto-generated UUID) | Bearer token that incoming requests must present. If unset, a random UUID is generated and printed to stderr on startup. |

### Request Behavior

| Variable | Default | Description |
|---|---|---|
| `AMUX_PROXY_LOG_LEVEL` | `warn` | Logging verbosity: `debug`, `info`, `warn`, `error`. |
| `AMUX_PROXY_TIMEOUT` | `600` | Request timeout in seconds. |
| `AMUX_PROXY_MAX_RETRIES` | `2` | Retries to the target provider on transient failures. |
| `AMUX_PROXY_STREAM` | `true` | Enable streaming (SSE/NDJSON) responses. |
| `AMUX_PROXY_DROP_UNSUPPORTED_PARAMS` | `true` | Silently drop parameters the target provider does not support. |

### Ollama (requires `amux-proxy[ollama]`)

| Variable | Default | Description |
|---|---|---|
| `AMUX_PROXY_OLLAMA_AUTO_PULL` | `true` | Pull the model automatically if it is not available locally. |
| `AMUX_PROXY_OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL. |
| `AMUX_PROXY_OLLAMA_MANAGE_SERVER` | `false` | Start and stop the Ollama server as part of the proxy lifecycle. |
| `AMUX_PROXY_OLLAMA_KEEP_ALIVE` | `5m` | How long to keep the model loaded in memory after the last request. |

### Provider Auth (standard LiteLLM variables)

| Provider | Variables |
|---|---|
| `anthropic` | `ANTHROPIC_API_KEY` |
| `openai` | `OPENAI_API_KEY` |
| `bedrock` | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION_NAME` (or `AWS_PROFILE`) |
| `vertex_ai` | `GOOGLE_APPLICATION_CREDENTIALS` or ADC; `VERTEXAI_PROJECT`, `VERTEXAI_LOCATION` |
| `azure` | `AZURE_API_KEY`, `AZURE_API_BASE`, `AZURE_API_VERSION` |
| `groq` | `GROQ_API_KEY` |
| `together_ai` | `TOGETHERAI_API_KEY` |
| `fireworks_ai` | `FIREWORKS_AI_API_KEY` |
| `deepseek` | `DEEPSEEK_API_KEY` |
| `mistral` | `MISTRAL_API_KEY` |
| `openrouter` | `OPENROUTER_API_KEY` |
| `cerebras` | `CEREBRAS_API_KEY` |
| `sambanova` | `SAMBANOVA_API_KEY` |

---

## Supported Transports

Each transport exposes a specific HTTP API that the harness expects to talk to.

| Transport | Endpoint Path | Wire Format | Typical Harness |
|---|---|---|---|
| `anthropic` | `POST /v1/messages` | Anthropic Messages API (SSE streaming) | Claude Code |
| `openai-chat` | `POST /v1/chat/completions` | OpenAI Chat Completions | OpenCode, Codex (`wire_api=chat`) |
| `openai-responses` | `POST /v1/responses` | OpenAI Responses API | Codex (default) |
| `google` | `POST /v1beta/models/:model:generateContent` | Google GenerateContent | Gemini CLI |

All transports also expose:
- `GET /health` — readiness check, returns `{"status":"ok","transport":"...","provider":"...","model":"..."}`
- `GET /v1/models` — list available models from the target provider
- `POST /v1/count_tokens` — token count estimation

---

## Docker

```bash
docker run --rm \
  -e AMUX_PROXY_TARGET_PROVIDER=bedrock \
  -e AMUX_PROXY_TARGET_MODEL="bedrock/anthropic.claude-sonnet-4-20250514-v1:0" \
  -e AMUX_PROXY_EXPOSED_TRANSPORT=anthropic \
  -e AMUX_PROXY_PORT=8080 \
  -e AMUX_PROXY_HOST=0.0.0.0 \
  -e AMUX_PROXY_AUTH_TOKEN=my-secret-token \
  -e AWS_REGION_NAME=us-east-1 \
  -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  -p 8080:8080 \
  ghcr.io/a5c-ai/amux-proxy:latest
```

The image includes Ollama support. Published to `ghcr.io/a5c-ai/amux-proxy:latest` and versioned tags (`amux-proxy-v*`). Multi-arch: `linux/amd64`, `linux/arm64`.

---

## License

MIT — see [LICENSE](../../LICENSE).
