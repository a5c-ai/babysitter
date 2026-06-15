# AI Providers Configuration Guide

> Source: https://hermes-agent.nousresearch.com/docs/integrations/providers

## Overview

Hermes Agent supports 50+ inference providers, from cloud APIs to self-hosted solutions. You need at least one configured provider to use the system.

## Cloud & API Providers

### Nous Portal (Recommended)
"One OAuth login covers 300+ frontier agentic models (Claude, GPT, Gemini, DeepSeek, Qwen, Kimi, GLM, MiniMax, Grok, ...)" plus integrated tools and billing through a unified subscription.

**Setup:** `hermes setup --portal` or `hermes model` -> select Nous Portal

### Anthropic (Native Claude)
Three authentication methods for Claude models:
- OAuth via `hermes model` (requires Claude Max + extra usage credits)
- API key: `ANTHROPIC_API_KEY` environment variable (pay-per-token)
- Setup token (legacy fallback)

**Usage:** `hermes chat --provider anthropic --model claude-sonnet-4-6`

### GitHub Copilot
Accesses GPT-5.x, Claude, Gemini through Copilot subscription.

**Auth priority:** `COPILOT_GITHUB_TOKEN` -> `GH_TOKEN` -> `GITHUB_TOKEN` -> `gh auth token`

**Token types:** OAuth tokens (gho_*), fine-grained PATs (github_pat_*), GitHub App tokens (ghu_*)

### OpenRouter
Multi-provider marketplace with cost optimization and routing strategies.

**Configuration:** `OPENROUTER_API_KEY` in `~/.hermes/.env`

**Routing options:**
- Sort by price, throughput, or latency
- Provider inclusion/exclusion lists
- Pareto Code Router for automated model selection

### Major API Providers (First-Class Support)

| Provider | Auth | Command |
|----------|------|---------|
| NovitaAI | `NOVITA_API_KEY` | `hermes chat --provider novita --model moonshotai/kimi-k2.5` |
| Qwen/GLM (z.ai) | `GLM_API_KEY` | `--provider zai` |
| Kimi/Moonshot | `KIMI_API_KEY` | `--provider kimi-coding` |
| MiniMax | `MINIMAX_API_KEY` | `--provider minimax` |
| DeepSeek | `DEEPSEEK_API_KEY` | `--provider deepseek` |
| NVIDIA NIM | `NVIDIA_API_KEY` | `--provider nvidia` |
| Google Gemini | `GOOGLE_API_KEY` or OAuth | `--provider gemini` |
| AWS Bedrock | AWS credentials | `--provider bedrock` |
| Hugging Face | `HF_TOKEN` | `--provider huggingface` |
| xAI Grok | `XAI_API_KEY` or OAuth | `--provider xai` |

## Self-Hosted & Local Solutions

### Ollama
Zero-configuration local model runner.

"Ollama defaults to very low context lengths" -- must be configured to support Hermes' minimum 64,000-token requirement.

**Context setup:**
```bash
OLLAMA_CONTEXT_LENGTH=64000 ollama serve
```

**Hermes config:**
```yaml
model:
  default: qwen2.5-coder:32b
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 64000
```

### vLLM (GPU Inference)
Production-grade serving with continuous batching.

**Tool calling requires:**
- `--enable-auto-tool-choice`
- `--tool-call-parser` (hermes, llama3_json, mistral, deepseek_v3, etc.)

### SGLang
Fast serving with RadixAttention for prefix caching.

**Setup:**
```bash
python -m sglang.launch_server \
  --model meta-llama/Llama-3.1-70B-Instruct \
  --tool-call-parser qwen
```

### llama.cpp
CPU/Metal inference for quantized models.

**Critical:** `--jinja` flag required for tool calling support

### LM Studio
Desktop application with GUI and local model support.

"Tool calling supported since LM Studio 0.3.6" with auto-detection for native-capable models.

## Custom Endpoints

Configure any OpenAI-compatible API:

```yaml
model:
  provider: custom
  base_url: http://localhost:8000/v1
  api_key: optional
  default: model-name
```

**For multiple custom endpoints (named providers):**
```yaml
custom_providers:
  - name: local
    base_url: http://localhost:8080/v1
  - name: work
    base_url: https://gpu-server.internal/v1
    key_env: CORP_API_KEY
```

Switch via: `/model custom:local:qwen-2.5`

### Popular Compatible Services
- Together AI (`api.together.xyz/v1`)
- Groq (`api.groq.com/openai/v1`)
- Perplexity (`api.perplexity.ai`)
- Mistral AI (`api.mistral.ai/v1`)
- Cerebras (`api.cerebras.ai/v1`)

## Context Length Configuration

**Critical distinction:**
- `context_length`: Total conversation + output budget (e.g., 200,000 tokens)
- `model.max_tokens`: Single response output cap only

"Hermes uses a multi-source resolution chain" including config overrides, endpoint queries, provider APIs, and community registries (models.dev) to detect correct windows automatically.

Explicit setting in config:
```yaml
model:
  context_length: 131072
```

## Windows WSL2 Setup

Two networking modes:
1. **Mirrored mode (Windows 11 22H2+):** Add `networkingMode=mirrored` to `%USERPROFILE%\.wslconfig`
2. **NAT mode:** Use Windows host IP (e.g., `172.29.192.1:11434`) instead of localhost

Server bind requirement for NAT: Models must listen on `0.0.0.0`, not `127.0.0.1`.

## Provider Switching

**Two commands with different purposes:**
- `hermes model` -- Terminal, outside session; full setup wizard for new providers
- `/model` -- Inside active session; switches between already-configured providers only

## Fallback Providers

Configure backup chain when primary provider fails:

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
  - provider: anthropic
    model: claude-sonnet-4
```

Supported fallback providers: openrouter, nous, novita, copilot, anthropic, gemini, bedrock, azure-foundry, custom, and others.

## Optional Tools & Services

| Feature | Service | Env Variable |
|---------|---------|--------------|
| Web scraping | Firecrawl | `FIRECRAWL_API_KEY` |
| Browser automation | Browserbase | `BROWSERBASE_API_KEY` |
| Image generation | FAL | `FAL_KEY` |
| Premium TTS | ElevenLabs | `ELEVENLABS_API_KEY` |
| OpenAI TTS | OpenAI | `VOICE_TOOLS_OPENAI_KEY` |
| Long-term memory | Supermemory | `SUPERMEMORY_API_KEY` |

---

*Hermes Agent automatically detects model capabilities and context windows across all providers. Configuration is persistent through `~/.hermes/config.yaml`.*
