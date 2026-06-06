# Provider Runtime Resolution

> Source: https://hermes-agent.nousresearch.com/docs/developer-guide/provider-runtime

## Overview

Hermes implements a shared provider runtime resolver used across CLI, gateway, cron jobs, ACP, and auxiliary model calls. The primary implementation files include `hermes_cli/runtime_provider.py`, `hermes_cli/auth.py`, and `hermes_cli/model_switch.py`.

## Core Architecture

The resolver uses a plugin-based system where providers are declared in `plugins/model-providers/<name>/` and register themselves via `register_provider()`. Each plugin specifies:

- `api_mode`
- `base_url`
- `env_vars`
- `fallback_models`

The `get_provider_profile()` function returns canonical configuration for any provider, eliminating duplication across the codebase.

## Resolution Precedence

Provider selection follows this hierarchy:

1. Explicit CLI/runtime request
2. `config.yaml` model/provider configuration
3. Environment variables
4. Provider-specific defaults or auto-resolution

This ordering ensures saved model choices take priority, preventing stale shell exports from overriding user selections.

## Supported Provider Families

The system includes 30+ provider integrations including:

- OpenRouter, Nous Portal, OpenAI Codex
- Anthropic (native), Google Gemini, DeepSeek
- AWS Bedrock, Azure Foundry, NVIDIA NIM
- Ollama Cloud, LM Studio
- Custom OpenAI-compatible endpoints

## Resolution Output

The resolver returns:

- Provider identifier
- API mode specification
- Base URL
- API key with source tracking
- Provider-specific metadata (expiry/refresh info)

## Key Implementation Details

**OpenAI-Compatible Endpoints**: The system prevents API key leakage by scoping credentials to specific base URLs. OpenAI keys work for custom endpoints as fallback.

**Native Anthropic Path**: When anthropic is selected, the system uses `api_mode = anthropic_messages` and native Messages API via `agent/anthropic_adapter.py`.

**Auxiliary Model Routing**: Tasks like vision, summarization, and memory operations can route to independent providers using the same runtime resolution path.

## Fallback Models

Hermes supports configured fallback provider chains -- ordered lists of `(provider, model)` pairs tried sequentially on errors.

**Activation Triggers**:
- Invalid API responses after max retries
- Non-retryable client errors (401, 403, 404)
- Transient errors (429, 500, 502, 503) after retry exhaustion

**Activation Process**: The system calls `_try_activate_fallback()` to rebuild the client with proper authentication, swap model/provider configuration in-place, and reset the retry counter.

**Limitations**: Subagent delegation inherits parent provider settings but not fallback configuration. Auxiliary tasks use independent auto-detection chains.

## Related Documentation

- Agent Loop Internals
- ACP Internals
- Context Compression & Prompt Caching
