# `amux-proxy` — Transport Protocol Bridge

> Archived design document. Preserved for historical context; not part of the current normative `reference/` contract.

**Specification v1.0** | `amux-proxy` (Python package)

---

## 1. Overview

`amux-proxy` is a lightweight Python package that bridges between LLM transport protocols. Each instance serves a single purpose: accept requests in one protocol format (the **exposed transport**) and forward them to a target provider in its native format, translating between the two using [LiteLLM](https://github.com/BerriAI/litellm) as the translation engine.

This enables vendor-locked harnesses (Claude Code speaks only Anthropic API, Codex speaks only OpenAI API, Gemini speaks only Google API) to use **any** LLM provider — Bedrock, Vertex, Ollama, Groq, Together, DeepSeek, or 140+ others supported by LiteLLM.

Additionally, `amux-proxy` supports pulling and serving local models via [Ollama](https://github.com/ollama/ollama-python), enabling fully offline / air-gapped coding agent usage.

### 1.1 Design Principles

- **Single-purpose instances**: Each proxy instance bridges exactly one (exposed transport, target provider) pair. No multi-tenant routing. This keeps configuration simple and failure domains small.
- **Ephemeral by default**: Designed to be spawned on-demand by `amux launch` and terminated when the harness exits. Can also run as a persistent service.
- **Env-var configured**: All configuration via environment variables for container/CI/CD friendliness.
- **Zero state**: No database, no persistence, no session management. Pure translation proxy.
- **LiteLLM for heavy lifting**: Protocol translation, provider auth, error mapping — all delegated to LiteLLM.

### 1.2 Cross-References

| Concept | Spec |
|---|---|
| `amux launch` command | `docs/launcher.md` |
| Provider configuration | `docs/amux-provider-config.md` |
| LiteLLM docs | `https://docs.litellm.ai` |
| Ollama Python | `https://github.com/ollama/ollama-python` |

---

## 2. Package Structure

```
amux-proxy/
├── pyproject.toml              # Package metadata, dependencies, entry points
├── Dockerfile                  # Container image
├── docker-compose.yml          # Example compose for persistent deployment
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, test, type-check
│       ├── publish.yml         # PyPI publish on tag
│       └── docker.yml          # Container image build + push
├── src/
│   └── amux_proxy/
│       ├── __init__.py
│       ├── __main__.py         # Entry point: python -m amux_proxy
│       ├── cli.py              # CLI argument parsing (click)
│       ├── config.py           # Configuration from env vars
│       ├── server.py           # ASGI server (uvicorn + FastAPI)
│       ├── errors.py           # Shared exception types and error helpers
│       ├── auth.py             # Request authentication (bearer token)
│       ├── transports/
│       │   ├── __init__.py
│       │   ├── anthropic.py    # /v1/messages endpoint
│       │   ├── openai_chat.py  # /v1/chat/completions endpoint
│       │   ├── openai_responses.py  # /v1/responses endpoint
│       │   └── google.py       # /v1beta/models/:model:generateContent endpoint
│       └── providers/
│           ├── __init__.py
│           ├── resolver.py     # LiteLLM provider resolution
│           └── ollama_server.py  # Ollama server lifecycle management (start, stop)
├── tests/
│   ├── conftest.py
│   ├── test_config.py
│   ├── test_anthropic_transport.py
│   ├── test_openai_chat_transport.py
│   ├── test_openai_responses_transport.py
│   ├── test_google_transport.py
│   ├── test_translation.py
│   ├── test_ollama_mgr.py
│   └── test_health.py
└── README.md
```

---

## 3. Configuration

All configuration is via environment variables. No config files.

### 3.1 Required Variables

| Variable | Description | Example |
|---|---|---|
| `AMUX_PROXY_TARGET_PROVIDER` | LiteLLM provider prefix for the target | `bedrock`, `vertex_ai`, `anthropic`, `ollama`, `groq`, `together_ai`, `openai` |
| `AMUX_PROXY_TARGET_MODEL` | Model identifier in LiteLLM format | `bedrock/anthropic.claude-sonnet-4-20250514-v1:0`, `ollama/qwen3:32b` |
| `AMUX_PROXY_EXPOSED_TRANSPORT` | Which transport to expose to the harness | `anthropic`, `openai-chat`, `openai-responses`, `google` |

### 3.2 Optional Variables

| Variable | Default | Description |
|---|---|---|
| `AMUX_PROXY_PORT` | `0` (ephemeral) | Port to listen on. `0` = OS-assigned. |
| `AMUX_PROXY_HOST` | `127.0.0.1` | Bind address. `127.0.0.1` for security. |
| `AMUX_PROXY_AUTH_TOKEN` | (auto-generated) | Bearer token required on incoming requests. If unset, a random UUID is generated and printed to stderr on startup. |
| `AMUX_PROXY_LOG_LEVEL` | `warn` | Logging level: `debug`, `info`, `warn`, `error`. |
| `AMUX_PROXY_TIMEOUT` | `600` | Request timeout in seconds. |
| `AMUX_PROXY_MAX_RETRIES` | `2` | Number of retries to the target provider on transient failures. |
| `AMUX_PROXY_STREAM` | `true` | Enable streaming responses. |
| `AMUX_PROXY_DROP_UNSUPPORTED_PARAMS` | `true` | Let LiteLLM silently drop params the target doesn't support. |

### 3.3 Provider Auth Variables

Provider authentication uses the standard LiteLLM environment variables:

| Provider | Variables |
|---|---|
| `anthropic` | `ANTHROPIC_API_KEY` |
| `openai` | `OPENAI_API_KEY` |
| `bedrock` | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION_NAME` (or `AWS_PROFILE`) |
| `vertex_ai` | `GOOGLE_APPLICATION_CREDENTIALS` or ADC, `VERTEXAI_PROJECT`, `VERTEXAI_LOCATION` |
| `azure` | `AZURE_API_KEY`, `AZURE_API_BASE`, `AZURE_API_VERSION` |
| `ollama` | (none — localhost) `OLLAMA_HOST` if non-default |
| `groq` | `GROQ_API_KEY` |
| `together_ai` | `TOGETHERAI_API_KEY` |
| `fireworks_ai` | `FIREWORKS_AI_API_KEY` |
| `deepseek` | `DEEPSEEK_API_KEY` |
| `mistral` | `MISTRAL_API_KEY` |
| `openrouter` | `OPENROUTER_API_KEY` |
| `cerebras` | `CEREBRAS_API_KEY` |
| `sambanova` | `SAMBANOVA_API_KEY` |

### 3.4 Ollama-Specific Variables

| Variable | Default | Description |
|---|---|---|
| `AMUX_PROXY_OLLAMA_AUTO_PULL` | `true` | Auto-pull model if not available locally. |
| `AMUX_PROXY_OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL. |
| `AMUX_PROXY_OLLAMA_MANAGE_SERVER` | `false` | Start/stop Ollama server with the proxy lifecycle. |
| `AMUX_PROXY_OLLAMA_KEEP_ALIVE` | `5m` | Keep model loaded in memory after last request. |

---

## 4. Architecture

### 4.1 Request Flow

```
┌─────────────┐     ┌──────────────────────────────────────────────┐     ┌──────────────┐
│   Harness    │     │                amux-proxy                    │     │   Provider    │
│ (Claude/     │────▶│                                              │────▶│ (Bedrock/    │
│  Codex/      │     │  ┌───────────┐  ┌───────────┐  ┌─────────┐ │     │  Vertex/     │
│  Gemini)     │◀────│  │ Transport │  │ LiteLLM   │  │ HTTP    │ │◀────│  Ollama/...) │
│              │     │  │ Endpoint  │─▶│ Translate  │─▶│ Client  │ │     │              │
│              │     │  └───────────┘  └───────────┘  └─────────┘ │     │              │
│              │     │       ▲                                      │     │              │
│              │     │       │ Bearer token auth                    │     │              │
│              │     └──────────────────────────────────────────────┘     └──────────────┘
└─────────────┘                                                          
```

### 4.2 Translation Pipeline

For each incoming request:

```python
async def handle_request(request: TransportRequest) -> TransportResponse:
    # 1. Authenticate: verify bearer token
    verify_auth(request)
    
    # 2. Parse: transport-specific request → normalized form
    messages, params = parse_transport_request(request)  # transport-specific
    
    # 3. Translate: normalized form → LiteLLM completion() call
    litellm_response = await litellm.acompletion(
        model=config.target_model,       # e.g., "bedrock/anthropic.claude-sonnet-4-..."
        messages=messages,
        stream=config.stream,
        timeout=config.timeout,
        num_retries=config.max_retries,
        drop_params=config.drop_unsupported_params,
        **params,                         # tool_choice, temperature, etc.
    )
    
    # 4. Format: LiteLLM response → transport-specific response
    return format_transport_response(litellm_response)  # transport-specific
```

### 4.3 Streaming Pipeline

For streaming requests, the proxy translates chunk-by-chunk:

```python
async def handle_streaming_request(request: TransportRequest) -> StreamingResponse:
    verify_auth(request)
    messages, params = parse_transport_request(request)
    
    response_stream = await litellm.acompletion(
        model=config.target_model,
        messages=messages,
        stream=True,
        **params,
    )
    
    async def generate():
        async for chunk in response_stream:
            yield format_transport_chunk(chunk)  # transport-specific SSE/NDJSON
    
    return StreamingResponse(generate(), media_type=transport_media_type())
```

---

## 5. Transport Endpoints

### 5.1 Anthropic Transport (`/v1/messages`)

Exposes the [Anthropic Messages API](https://docs.anthropic.com/en/api/messages) format:

```
POST /v1/messages
Content-Type: application/json
X-Api-Key: <auth_token>
```

**Request body**: Anthropic Messages format with `model`, `messages`, `max_tokens`, `system`, `tools`, `tool_choice`, `stream`, `metadata`, `thinking`.

**Response**: Anthropic Messages response or SSE stream.

**Translation**:
- Incoming Anthropic format → LiteLLM `messages` (OpenAI format internally)
- LiteLLM handles the translation to the target provider
- LiteLLM response (OpenAI format) → Anthropic response format

Key translation details:
- `thinking` blocks → handled by LiteLLM's thinking/reasoning support
- `tool_use` / `tool_result` content blocks → LiteLLM `tools` / `tool_calls`
- SSE event types: `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`
- `anthropic-version` header is accepted but not forwarded (the proxy speaks the target provider's protocol)

### 5.2 OpenAI Chat Completions Transport (`/v1/chat/completions`)

Exposes the [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/chat):

```
POST /v1/chat/completions
Content-Type: application/json
Authorization: Bearer <auth_token>
```

**Request body**: OpenAI Chat Completions format with `model`, `messages`, `max_tokens`, `temperature`, `tools`, `tool_choice`, `stream`, `response_format`.

**Response**: OpenAI Chat Completions response or SSE stream.

**Translation**: This is the most straightforward path since LiteLLM's internal format is OpenAI-compatible. The request is passed nearly verbatim to `litellm.completion()`, and the response is returned as-is.

### 5.3 OpenAI Responses Transport (`/v1/responses`)

Exposes the [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses):

```
POST /v1/responses
Content-Type: application/json
Authorization: Bearer <auth_token>
```

**Request body**: OpenAI Responses format with `model`, `input`, `instructions`, `tools`, `max_output_tokens`, `stream`.

**Response**: OpenAI Responses response or SSE stream.

**Translation**:
- `input` (string or array) → LiteLLM `messages` array
- `instructions` → `system` message
- Response items → reconstructed from LiteLLM response
- Streaming events: `response.created`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.completed`

Note: `previous_response_id` and multi-turn context are not maintained (the proxy is stateless). The harness is expected to manage conversation history.

### 5.4 Google GenerateContent Transport (`/v1beta/models/:model:generateContent`)

Exposes the [Google Generative AI API](https://ai.google.dev/api/rest):

```
POST /v1beta/models/{model}:generateContent
POST /v1beta/models/{model}:streamGenerateContent
Content-Type: application/json
X-Goog-Api-Key: <auth_token>
```

**Request body**: Google GenerateContent format with `contents`, `systemInstruction`, `tools`, `toolConfig`, `generationConfig`.

**Response**: Google GenerateContent response or SSE stream.

**Translation**:
- `contents[].parts[]` → LiteLLM `messages[].content` (text, image, function_call, function_response)
- `generationConfig` → LiteLLM params (temperature, maxOutputTokens, etc.)
- `tools[].functionDeclarations` → LiteLLM `tools` (OpenAI format)
- Response `candidates[].content.parts[]` → reconstructed from LiteLLM response
- `streamGenerateContent` → SSE chunks

### 5.5 Common Endpoints

All transports also serve:

```
GET  /health          → { "status": "ok", "transport": "anthropic", "provider": "bedrock" }
GET  /v1/models       → List available models from the target provider
POST /v1/count_tokens → Token count estimation (where provider supports it)
```

---

## 6. Ollama Integration (Local Models)

### 6.1 Model Management

`amux-proxy` includes an Ollama model manager that handles local model lifecycle:

```python
# src/amux_proxy/providers/ollama_mgr.py

import ollama

class OllamaManager:
    def __init__(self, host: str = "http://localhost:11434"):
        self.client = ollama.Client(host=host)
    
    async def ensure_model(self, model: str, auto_pull: bool = True) -> bool:
        """Ensure model is available locally. Pull if needed."""
        available = self.list_models()
        if model in available:
            return True
        if not auto_pull:
            raise ModelNotAvailable(f"Model '{model}' not found locally. "
                                     "Set AMUX_PROXY_OLLAMA_AUTO_PULL=true to auto-pull.")
        await self.pull_model(model)
        return True
    
    def list_models(self) -> list[str]:
        """List locally available model names."""
        response = self.client.list()
        return [m.model for m in response.models]
    
    async def pull_model(self, model: str) -> None:
        """Pull a model with progress reporting to stderr."""
        import sys
        for progress in self.client.pull(model, stream=True):
            status = progress.get('status', '')
            completed = progress.get('completed', 0)
            total = progress.get('total', 0)
            if total > 0:
                pct = (completed / total) * 100
                print(f"\r[amux-proxy] Pulling {model}: {status} {pct:.1f}%", 
                      end='', file=sys.stderr)
            else:
                print(f"\r[amux-proxy] Pulling {model}: {status}", 
                      end='', file=sys.stderr)
        print(file=sys.stderr)  # newline after progress
    
    def health_check(self) -> bool:
        """Check if Ollama server is reachable."""
        try:
            self.client.list()
            return True
        except Exception:
            return False
```

### 6.2 Server Lifecycle Management

When `AMUX_PROXY_OLLAMA_MANAGE_SERVER=true`:

```python
import subprocess
import time

class OllamaServerManager:
    def __init__(self):
        self.process: subprocess.Popen | None = None
    
    def start(self, host: str = "127.0.0.1", port: int = 11434) -> None:
        """Start Ollama server as a subprocess."""
        self.process = subprocess.Popen(
            ["ollama", "serve"],
            env={**os.environ, "OLLAMA_HOST": f"{host}:{port}"},
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        # Wait for server readiness
        for _ in range(30):  # 30s timeout
            if OllamaManager(f"http://{host}:{port}").health_check():
                return
            time.sleep(1)
        raise RuntimeError("Ollama server failed to start within 30s")
    
    def stop(self) -> None:
        """Stop the managed Ollama server."""
        if self.process:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self.process = None
```

### 6.3 LiteLLM + Ollama

When the target provider is `ollama`, LiteLLM routes through Ollama's OpenAI-compatible endpoint:

```python
# Model format: "ollama/<model_name>"
response = await litellm.acompletion(
    model="ollama/qwen3:32b",
    messages=messages,
    api_base="http://localhost:11434",
    stream=True,
)
```

LiteLLM handles the translation between whatever the exposed transport format is and the Ollama-compatible OpenAI Chat format.

---

## 7. Server Implementation

### 7.1 ASGI Application

```python
# src/amux_proxy/server.py

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
import uvicorn

from .config import ProxyConfig
from .auth import verify_bearer_token
from .translate import create_translator

def create_app(config: ProxyConfig) -> FastAPI:
    app = FastAPI(
        title="amux-proxy",
        description="Transport protocol bridge for coding agent harnesses",
        version="1.0.0",
    )
    
    translator = create_translator(config)
    
    # Mount transport-specific routes based on config
    if config.exposed_transport == "anthropic":
        from .transports.anthropic import create_router
        app.include_router(create_router(translator, config))
    elif config.exposed_transport == "openai-chat":
        from .transports.openai_chat import create_router
        app.include_router(create_router(translator, config))
    elif config.exposed_transport == "openai-responses":
        from .transports.openai_responses import create_router
        app.include_router(create_router(translator, config))
    elif config.exposed_transport == "google":
        from .transports.google import create_router
        app.include_router(create_router(translator, config))
    
    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "transport": config.exposed_transport,
            "provider": config.target_provider,
            "model": config.target_model,
        }
    
    return app


def run_server(config: ProxyConfig) -> None:
    app = create_app(config)
    
    # Print startup info to stderr (stdout is reserved for structured output)
    import sys
    print(f"[amux-proxy] Listening on {config.host}:{config.port}", file=sys.stderr)
    print(f"[amux-proxy] Transport: {config.exposed_transport} → {config.target_provider}", file=sys.stderr)
    print(f"[amux-proxy] Model: {config.target_model}", file=sys.stderr)
    
    # Print structured startup info to stdout for amux launch to parse
    import json
    print(json.dumps({
        "event": "ready",
        "port": config.port,
        "auth_token": config.auth_token,
        "url": f"http://{config.host}:{config.port}",
    }), flush=True)
    
    uvicorn.run(
        app,
        host=config.host,
        port=config.port,
        log_level=config.log_level,
        access_log=config.log_level == "debug",
    )
```

### 7.2 Startup Protocol

When spawned by `amux launch`, the proxy communicates readiness via stdout:

1. Proxy starts, binds to port
2. Proxy prints a JSON line to stdout: `{"event": "ready", "port": <actual_port>, "auth_token": "<token>", "url": "http://127.0.0.1:<port>"}`
3. `amux launch` reads this line, extracts port and token
4. `amux launch` configures the harness with the proxy URL and token
5. All subsequent proxy output goes to stderr (at configured log level)

This protocol allows `amux launch` to use ephemeral ports (`port=0`) and receive the OS-assigned port.

---

## 8. CLI Interface

### 8.1 Entry Points

```bash
# As Python module
python -m amux_proxy

# As installed script
amux-proxy

# As pip-installed command
pip install amux-proxy && amux-proxy
```

### 8.2 CLI Arguments

```
Usage: amux-proxy [OPTIONS]

Options:
  --target-provider TEXT    LiteLLM provider name [env: AMUX_PROXY_TARGET_PROVIDER]
  --target-model TEXT       LiteLLM model identifier [env: AMUX_PROXY_TARGET_MODEL]
  --transport TEXT          Exposed transport protocol [env: AMUX_PROXY_EXPOSED_TRANSPORT]
  --port INTEGER            Listen port (0=auto) [env: AMUX_PROXY_PORT] [default: 0]
  --host TEXT               Bind address [env: AMUX_PROXY_HOST] [default: 127.0.0.1]
  --auth-token TEXT         Bearer token for auth [env: AMUX_PROXY_AUTH_TOKEN]
  --log-level TEXT          Log level [env: AMUX_PROXY_LOG_LEVEL] [default: warn]
  --timeout INTEGER         Request timeout seconds [env: AMUX_PROXY_TIMEOUT] [default: 600]
  --version                 Show version and exit
  --help                    Show this message and exit
```

CLI arguments take precedence over environment variables.

### 8.3 Examples

```bash
# Bridge Anthropic API → Bedrock
AMUX_PROXY_TARGET_PROVIDER=bedrock \
AMUX_PROXY_TARGET_MODEL="bedrock/anthropic.claude-sonnet-4-20250514-v1:0" \
AMUX_PROXY_EXPOSED_TRANSPORT=anthropic \
AWS_REGION_NAME=us-east-1 \
amux-proxy --port 8080

# Bridge OpenAI Responses API → Vertex AI
amux-proxy \
  --target-provider vertex_ai \
  --target-model "vertex_ai/claude-sonnet-4@20250514" \
  --transport openai-responses \
  --port 8080

# Bridge Anthropic API → local Ollama
amux-proxy \
  --target-provider ollama \
  --target-model "ollama/qwen3:32b" \
  --transport anthropic \
  --port 8080

# Bridge Google GenerateContent → OpenAI
OPENAI_API_KEY=sk-... \
amux-proxy \
  --target-provider openai \
  --target-model "openai/gpt-4o" \
  --transport google \
  --port 8080
```

---

## 9. Dependencies

### 9.1 Python Requirements

```toml
# pyproject.toml
[project]
name = "amux-proxy"
version = "1.0.0"
description = "Transport protocol bridge for coding agent harnesses"
requires-python = ">=3.11"
license = { text = "MIT" }
authors = [{ name = "A5C AI", email = "eng@a5c.ai" }]

dependencies = [
    "litellm>=1.60.0",
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "click>=8.1.0",
    "pydantic>=2.0.0",
    "httpx>=0.27.0",
]

[project.optional-dependencies]
ollama = [
    "ollama>=0.4.0",
]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.24",
    "pytest-httpx>=0.30",
    "ruff>=0.8.0",
    "mypy>=1.13",
    "httpx>=0.27.0",
]
all = [
    "amux-proxy[ollama,dev]",
]

[project.scripts]
amux-proxy = "amux_proxy.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/amux_proxy"]

[tool.ruff]
target-version = "py311"
line-length = 120

[tool.mypy]
python_version = "3.11"
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

### 9.2 Key Dependency Rationale

| Dependency | Why |
|---|---|
| `litellm` | Core translation engine. 140+ providers, format translation, error mapping, retry logic. |
| `fastapi` | ASGI framework for transport endpoints. Pydantic integration for request validation. |
| `uvicorn` | High-performance ASGI server. Standard extras include `uvloop` + `httptools`. |
| `click` | CLI framework. Consistent arg parsing with env var integration. |
| `pydantic` | Request/response validation matching API schemas. |
| `httpx` | HTTP client for health checks and proxy-internal communication. |
| `ollama` | Optional. Local model management (pull, serve, list). |

---

## 10. CI/CD

### 10.1 GitHub Actions Workflows

#### `ci.yml` — Lint, Type-Check, Test

```yaml
name: CI
on:
  push:
    branches: [main]
    paths: ["packages/amux-proxy/**"]
  pull_request:
    paths: ["packages/amux-proxy/**"]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -e ".[dev]"
        working-directory: packages/amux-proxy
      - run: ruff check .
        working-directory: packages/amux-proxy
      - run: ruff format --check .
        working-directory: packages/amux-proxy
      - run: mypy src/
        working-directory: packages/amux-proxy

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -e ".[all]"
        working-directory: packages/amux-proxy
      - run: pytest --tb=short -q
        working-directory: packages/amux-proxy
```

#### `publish.yml` — PyPI Release

```yaml
name: Publish
on:
  push:
    tags: ["amux-proxy-v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install build
      - run: python -m build
        working-directory: packages/amux-proxy
      - uses: pypa/gh-action-pypi-publish@release/v1
        with:
          packages-dir: packages/amux-proxy/dist/
```

#### `docker.yml` — Container Image

```yaml
name: Docker
on:
  push:
    tags: ["amux-proxy-v*"]

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: packages/amux-proxy
          push: true
          tags: ghcr.io/a5c-ai/amux-proxy:${{ github.ref_name }},ghcr.io/a5c-ai/amux-proxy:latest
          platforms: linux/amd64,linux/arm64
```

### 10.2 Dockerfile

```dockerfile
FROM python:3.11-slim AS base

WORKDIR /app

# Install dependencies first for caching
COPY pyproject.toml .
RUN pip install --no-cache-dir ".[ollama]"

# Copy source
COPY src/ src/

# Non-root user
RUN useradd -m -r proxy && chown -R proxy:proxy /app
USER proxy

EXPOSE 8080

ENTRYPOINT ["amux-proxy"]
CMD ["--port", "8080", "--host", "0.0.0.0"]
```

### 10.3 Docker Compose Example

```yaml
version: "3.9"

services:
  amux-proxy:
    build: .
    ports:
      - "8080:8080"
    environment:
      AMUX_PROXY_TARGET_PROVIDER: bedrock
      AMUX_PROXY_TARGET_MODEL: "bedrock/anthropic.claude-sonnet-4-20250514-v1:0"
      AMUX_PROXY_EXPOSED_TRANSPORT: anthropic
      AMUX_PROXY_PORT: "8080"
      AMUX_PROXY_HOST: "0.0.0.0"
      AWS_REGION_NAME: us-east-1
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

Each transport endpoint has dedicated tests that verify request parsing, response formatting, and streaming behavior using mock LiteLLM responses.

```python
# tests/test_anthropic_transport.py

import pytest
from httpx import AsyncClient
from amux_proxy.server import create_app
from amux_proxy.config import ProxyConfig
from unittest.mock import patch, AsyncMock

@pytest.fixture
def app():
    config = ProxyConfig(
        target_provider="openai",
        target_model="openai/gpt-4o",
        exposed_transport="anthropic",
        auth_token="test-token",
    )
    return create_app(config)

@pytest.fixture
async def client(app):
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

async def test_messages_endpoint(client):
    """Anthropic Messages request is translated and forwarded."""
    mock_response = MockLiteLLMResponse(content="Hello from GPT-4o")
    
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=mock_response):
        resp = await client.post("/v1/messages", json={
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": "Hello"}],
        }, headers={"X-Api-Key": "test-token"})
    
    assert resp.status_code == 200
    body = resp.json()
    assert body["type"] == "message"
    assert body["content"][0]["text"] == "Hello from GPT-4o"

async def test_auth_required(client):
    """Requests without valid auth token are rejected."""
    resp = await client.post("/v1/messages", json={
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": "Hello"}],
    })
    assert resp.status_code == 401
```

### 11.2 Integration Tests

Integration tests spin up a real proxy instance and verify end-to-end behavior with mocked LiteLLM backends.

### 11.3 Transport Conformance Tests

Each transport has conformance tests that validate the proxy's responses match the official API spec. These test suites can be run against the real provider APIs to verify translation fidelity.

---

## 12. Error Handling

### 12.1 Error Translation

LiteLLM exceptions are translated into transport-appropriate error responses:

| LiteLLM Exception | HTTP Status | Anthropic Error | OpenAI Error |
|---|---|---|---|
| `AuthenticationError` | 401 | `authentication_error` | `invalid_api_key` |
| `RateLimitError` | 429 | `rate_limit_error` | `rate_limit_exceeded` |
| `BadRequestError` | 400 | `invalid_request_error` | `invalid_request_error` |
| `NotFoundError` | 404 | `not_found_error` | `model_not_found` |
| `APIError` | 500 | `api_error` | `server_error` |
| `Timeout` | 408 | `timeout_error` | `timeout` |
| `ServiceUnavailableError` | 503 | `overloaded_error` | `server_error` |

### 12.2 Proxy-Specific Errors

| Condition | HTTP Status | Body |
|---|---|---|
| Invalid auth token | 401 | `{"error": {"type": "authentication_error", "message": "Invalid bearer token"}}` |
| Proxy misconfigured | 500 | `{"error": {"type": "proxy_error", "message": "..."}}` |
| Ollama model not found | 404 | `{"error": {"type": "not_found_error", "message": "Model not available locally"}}` |
| Ollama server down | 503 | `{"error": {"type": "service_unavailable", "message": "Ollama server not reachable"}}` |

---

## 13. End-to-End Examples

### 13.1 Claude Code via Bedrock

```bash
# The full amux launch command
amux launch claude bedrock \
  --region us-east-1 \
  --model anthropic.claude-sonnet-4-20250514-v1:0

# What happens internally:
# 1. amux detects claude supports bedrock natively (CLAUDE_CODE_USE_BEDROCK)
# 2. No proxy needed
# 3. Spawns: CLAUDE_CODE_USE_BEDROCK=1 AWS_REGION=us-east-1 claude
```

### 13.2 Codex via Bedrock (Proxy Required)

```bash
# The full amux launch command
amux launch codex bedrock \
  --region us-east-1 \
  --model anthropic.claude-sonnet-4-20250514-v1:0 \
  --with-proxy-if-needed

# What happens internally:
# 1. amux detects codex does NOT support bedrock natively
# 2. Codex speaks openai-responses, bedrock speaks anthropic → proxy needed
# 3. Spawns proxy: AMUX_PROXY_TARGET_PROVIDER=bedrock
#                   AMUX_PROXY_TARGET_MODEL=bedrock/anthropic.claude-sonnet-4-20250514-v1:0
#                   AMUX_PROXY_EXPOSED_TRANSPORT=openai-responses
#                   AWS_REGION_NAME=us-east-1
#                   amux-proxy --port 0
# 4. Proxy reports: {"event":"ready","port":54321,"auth_token":"uuid-xxx"}
# 5. Spawns codex: OPENAI_BASE_URL=http://127.0.0.1:54321
#                   OPENAI_API_KEY=uuid-xxx
#                   codex
```

### 13.3 Gemini via Anthropic API (Proxy Required)

```bash
amux launch gemini anthropic \
  --api-key $ANTHROPIC_API_KEY \
  --model claude-sonnet-4-20250514 \
  --with-proxy-if-needed

# 1. Gemini speaks google, Anthropic API speaks anthropic → proxy needed
# 2. Proxy: anthropic → google translation
# 3. Gemini gets: CODE_ASSIST_ENDPOINT=http://127.0.0.1:<port>
```

### 13.4 Claude Code via Local Ollama

```bash
amux launch claude ollama \
  --model qwen3:32b \
  --with-proxy-if-needed

# 1. Claude can use ANTHROPIC_BASE_URL but Ollama speaks openai-chat, not anthropic
# 2. Proxy: ollama → anthropic translation
# 3. Proxy auto-pulls qwen3:32b if not available
# 4. Claude gets: ANTHROPIC_BASE_URL=http://127.0.0.1:<port>
```

### 13.5 Standalone Proxy (Persistent Service)

```bash
# Run as a persistent Anthropic-to-Bedrock bridge
AMUX_PROXY_TARGET_PROVIDER=bedrock \
AMUX_PROXY_TARGET_MODEL="bedrock/anthropic.claude-sonnet-4-20250514-v1:0" \
AMUX_PROXY_EXPOSED_TRANSPORT=anthropic \
AMUX_PROXY_PORT=8080 \
AMUX_PROXY_HOST=0.0.0.0 \
AMUX_PROXY_AUTH_TOKEN=my-secret-token \
AWS_REGION_NAME=us-east-1 \
amux-proxy

# Then point any Anthropic-speaking tool at it:
ANTHROPIC_BASE_URL=http://proxy-host:8080 \
ANTHROPIC_API_KEY=my-secret-token \
claude -p "hello"
```

---

## 14. Monorepo Integration

The `amux-proxy` package lives at `packages/amux-proxy/` within the agent-mux monorepo. It is a Python package in a Node.js monorepo, so:

- It has its own `pyproject.toml` (not managed by npm workspaces)
- It has its own CI workflows (triggered by path filters)
- It is published to PyPI independently
- The `@a5c-ai/agent-mux-cli` package lists `amux-proxy` as a suggested dependency with install guidance
- `amux launch --with-proxy-if-needed` detects `amux-proxy` availability via `which amux-proxy` or `python -m amux_proxy --version`

### 14.1 Installation

```bash
# Standalone
pip install amux-proxy

# With Ollama support
pip install "amux-proxy[ollama]"

# From source (development)
cd packages/amux-proxy
pip install -e ".[dev]"
```

---

## 15. Future Considerations

### 15.1 Caching

Add response caching (exact match on messages + model) for development workflows where the same prompt is re-run. Use `AMUX_PROXY_CACHE=true` with a SQLite or file-based cache.

### 15.2 Cost Tracking

LiteLLM provides cost data in responses. The proxy could aggregate and report costs via `/metrics` endpoint or structured logs.

### 15.3 Multi-Model Routing

A future version could support LiteLLM Router for load balancing across multiple model deployments (e.g., primary Bedrock + fallback Vertex).

### 15.4 WebSocket Transport

Add WebSocket support for the Responses API transport (`ws://host/v1/responses`) for lower-latency persistent connections.

### 15.5 MCP Passthrough

Some transports may need to forward MCP-related endpoints. This is not needed in v1.0 since MCP is handled by the harness directly, not through the LLM API.
