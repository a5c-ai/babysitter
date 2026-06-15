# Provider Adapter & Launcher — Remaining Work

49 open items ordered by dependency. Items earlier in the list unblock items later.

---

## Tier 0: Cleanup & Fixes (no dependencies, unblocks everything)

These are quick fixes that remove confusion and unblock correct work downstream.

| # | Task | Files | Depends on |
|---|---|---|---|
| 1 | Remove dead `OllamaManager` class and its tests — `OllamaServerManager` is the real implementation | `providers/ollama_mgr.py`, `tests/test_ollama_mgr.py` | — |
| 2 | Remove stale re-exports in `launch.ts` (`isNativelySupported`, `getRequiredProxyTransport` imported but only re-exported, never used in resolution) | `packages/cli/src/commands/launch.ts:22-24` | — |
| 3 | Remove `a2a` from `TransportId` type and config validator (no implementation, misleads users) | `packages/core/src/provider-config.ts`, `packages/adapters-proxy/src/adapters_proxy/config.py` | — |
| 4 | Update spec: `docs/provider-adapter.md` §2 lists `translate.py` and `health.py` as separate files — they're inline in transport endpoints and `server.py`. Update spec to match | `docs/provider-adapter.md` | — |
| 5 | Update spec: `docs/adapters-provider-config.md` §8.2 says "single-use bearer token" — it's session-scoped. Fix wording | `docs/adapters-provider-config.md` | — |
| 6 | Delete or populate empty `tests/conftest.py` (contains only `import pytest`) | `packages/adapters-proxy/tests/conftest.py` | — |
| 7 | Fix `/v1/count_tokens` to return HTTP 400/500 on error instead of `{"count": -1, "error": "..."}` with 200 | `packages/adapters-proxy/src/adapters_proxy/server.py` | — |
| 8 | Fix `ollama list` string matching — parse line-by-line and check first column instead of `includes()` | `packages/cli/src/commands/launch.ts` | — |
| 9 | Fix default `proxyMode` — should be `'never'` when no `--with-proxy*` flag is given, with clear error when proxy is needed | `packages/cli/src/commands/launch.ts` | — |
| 10 | Add `--resume` validation — check `adapter.capabilities.canResume`, error for unsupported harnesses | `packages/cli/src/commands/launch.ts` | — |
| 11 | Migrate FastAPI `@app.on_event("startup"/"shutdown")` to `lifespan` context manager (deprecated API) | `packages/adapters-proxy/src/adapters_proxy/server.py` | — |

---

## Tier 1: Core Infrastructure (unblocks most feature work)

| # | Task | Files | Depends on |
|---|---|---|---|
| 12 | Fix Python env: CI workflow must use isolated venv (`python -m venv` or `uv`) to avoid pydantic v1/v2 conflict | `.github/workflows/adapters-proxy-ci.yml` | — |
| 13 | `ProviderConfig.params` → `Record<string, unknown>` — support rich LiteLLM config (RPM/TPM, custom headers, retry policies, `aws_bedrock_runtime_endpoint`, `vertex_credentials`) | `packages/core/src/provider-config.ts`, `provider-resolver.ts`, all translators | — |
| 14 | Add `--provider-arg key=value` repeatable CLI flag — flows arbitrary key-value pairs into `ProviderConfig.params` | `packages/cli/src/commands/launch.ts` | 13 |
| 15 | Dynamic provider detection — pass `provider/model` string to LiteLLM directly via `custom` provider instead of maintaining static `ProviderId` union. Keep named providers for defaults but let unknown prefixes pass through | `packages/core/src/provider-config.ts`, `provider-resolver.ts` | 13 |
| 16 | Transport-level redundancy detection — if harness's native transport matches provider's API format, skip proxy even when provider isn't in the native support matrix | `packages/core/src/provider-support-matrix.ts`, `packages/cli/src/commands/launch.ts` | — |
| 17 | Proxy installation pre-check — `--with-proxy-if-needed` should verify `adapters-proxy` is installed before attempting spawn, with `pip install adapters-proxy` guidance | `packages/cli/src/commands/launch.ts` | — |
| 18 | PTY allocation for interactive mode — use `node-pty` for TUI harnesses (Claude, Codex, Gemini) | `packages/cli/src/commands/launch.ts` | — |
| 19 | JSON schema file for `providers.json` — create schema, reference from spec | `packages/core/schemas/adapters-providers.schema.json`, `docs/adapters-provider-config.md` | — |

---

## Tier 2: Transport Endpoints (unblocks cloud-provider fidelity)

| # | Task | Files | Depends on |
|---|---|---|---|
| 20 | Passthrough transport — forward requests in provider's native format (no translation). Add `passthrough` to `TransportId`. URL pattern: `PROXY/anthropic/v1/messages` → `api.anthropic.com/v1/messages` | `packages/adapters-proxy/src/adapters_proxy/transports/passthrough.py`, `packages/core/src/provider-config.ts` | — |
| 21 | Bedrock Converse native endpoint — `POST /converse` mapping to Bedrock's Converse API. Avoids double-translation. Supports guardrails, document blocks | `packages/adapters-proxy/src/adapters_proxy/transports/bedrock_converse.py` | — |
| 22 | Vertex AI native endpoint — Vertex-specific `generateContent` with grounding, safety settings, cached content. Differs from public Gemini format for Claude-on-Vertex | `packages/adapters-proxy/src/adapters_proxy/transports/vertex_native.py` | — |
| 23 | Azure AI Foundry endpoint — distinct from Azure OpenAI. Foundry-specific features via LiteLLM `azure_ai` provider | `packages/adapters-proxy/src/adapters_proxy/transports/azure_foundry.py` | — |
| 24 | Add `passthrough`, `bedrock-converse`, `vertex-native`, `azure-foundry` to `--transport` CLI option and `TransportId` type | `packages/core/src/provider-config.ts`, `packages/cli/src/commands/launch.ts` | 20, 21, 22, 23 |

---

## Tier 3: Provider Coverage (unblocks broader model access)

| # | Task | Files | Depends on |
|---|---|---|---|
| 25 | LM Studio as first-class local provider — `'lmstudio'`, `apiBase: 'http://localhost:1234'`, OpenAI-compatible | `packages/core/src/provider-config.ts` | 15 |
| 26 | vLLM as first-class local provider — `'vllm'`, configurable endpoint, OpenAI-compatible | `packages/core/src/provider-config.ts` | 15 |
| 27 | Additional cloud providers — `nvidia-nim`, `databricks`, `cloudflare`, `replicate`, `anyscale`, `huggingface`, `perplexity`, `cohere` with proper defaults | `packages/core/src/provider-config.ts` | 15 |

---

## Tier 4: Harness Translation Completeness (unblocks full harness coverage)

| # | Task | Files | Depends on |
|---|---|---|---|
| 28 | Claude translator: add `CLAUDE_CODE_AUTO_COMPACT_WINDOW` for Ollama context window config (from `ollama/cmd/launch/claude.go`) | `packages/adapters/src/translations/claude-translation.ts` | — |
| 29 | Codex translator: add version check (minimum v0.81.0) and `config.toml` profile generation (from `ollama/cmd/launch/codex.go`) | `packages/adapters/src/translations/codex-translation.ts` | — |
| 30 | OpenCode translator: merge generated config with existing `opencode.json` (preserve agents, tools, permissions); add state management for `~/.local/state/opencode/model.json` (from `ollama/cmd/launch/opencode.go`) | `packages/adapters/src/translations/opencode-translation.ts` | — |
| 31 | OpenCode prompt injection — `appendHarnessSessionArgs()` has no OpenCode path for `-p` prompt delivery. Research OpenCode's non-interactive API | `packages/cli/src/commands/launch.ts` | — |
| 32 | Translators for remaining harnesses: Copilot, Cursor, Pi, OMP, OpenClaw, Hermes, Droid, Amp, Qwen — detect native provider support where possible | `packages/adapters/src/translations/` | — |

---

## Tier 5: Launch Orchestration (unblocks full original request flow)

| # | Task | Files | Depends on |
|---|---|---|---|
| 33 | End-to-end Ollama lifecycle — `adapters launch claude ollama --model qwen3:32b` should: check Ollama running → start if needed → check model pulled → pull if needed → launch proxy → launch harness. Wire `OllamaManager` (model pull) into the flow alongside `OllamaServerManager` (server lifecycle) | `packages/cli/src/commands/launch.ts`, `packages/adapters-proxy/` | 1, 8 |
| 34 | Full auth validation — STS check for Bedrock, ADC check for Vertex, key format validation. Error before spawning instead of letting harness fail | `packages/cli/src/commands/launch.ts` | 14 |
| 35 | LiteLLM Router for multi-deployment fallback — support `ADAPTERS_PROXY_ROUTER_CONFIG` env var for `litellm.Router` with fallback chains (primary Bedrock → fallback Anthropic) | `packages/adapters-proxy/src/adapters_proxy/server.py` | 13 |

---

## Tier 6: Test Coverage (unblocks confidence for all above)

| # | Task | Files | Depends on |
|---|---|---|---|
| 36 | Python transport endpoint tests — unit tests for all 4 transports (Anthropic, OpenAI Chat, OpenAI Responses, Google): request parsing, response formatting, streaming, error handling | `packages/adapters-proxy/tests/test_anthropic_transport.py`, `test_openai_chat.py`, `test_openai_responses.py`, `test_google.py` | 12 |
| 37 | Python CLI tests — missing args validation, config construction, `--version` | `packages/adapters-proxy/tests/test_cli.py` | 12 |
| 38 | Python server tests — transport router mounting, `/v1/count_tokens`, `/v1/models`, Ollama lifecycle hooks | `packages/adapters-proxy/tests/test_server.py` | 12 |
| 39 | Integration tests with real LiteLLM — at least one test calling a real provider (Ollama local or Groq with test key) | `packages/adapters-proxy/tests/test_integration.py` | 12, 36 |
| 40 | TypeScript launch e2e with mock harness — test full spawn + proxy lifecycle + cleanup + signal forwarding using `harness-mock` | `packages/cli/tests/launch-e2e.test.ts` | 9, 17 |

---

## Tier 7: CI/CD & Packaging (unblocks distribution)

| # | Task | Files | Depends on |
|---|---|---|---|
| 41 | PyPI trusted publisher — configure PyPI project with GitHub repo as trusted publisher | PyPI admin, `.github/workflows/adapters-proxy-publish.yml` | 12 |
| 42 | GHCR Docker registry — create repo, configure `packages: write` permission | GitHub repo settings | — |
| 43 | adapters-proxy version sync — strategy for coordinating Python version with TS changesets (manual tag? script?) | `packages/adapters-proxy/pyproject.toml`, `__init__.py` | — |

---

## Tier 8: Docs (can run anytime)

| # | Task | Files | Depends on |
|---|---|---|---|
| 44 | Update `docs/provider-adapter.md` §2 package structure to match reality (no `translate.py`, no `health.py`, add `errors.py`, `providers/ollama_server.py`) | `docs/provider-adapter.md` | 4 |
| 45 | Update `docs/adapters-provider-config.md` §8.2 bearer token wording | `docs/adapters-provider-config.md` | 5 |
| 46 | Create JSON schema file for providers.json | `packages/core/schemas/` or `docs/schemas/` | 19 |

---

## Tier 9: Future Enhancements (nice-to-have, no blockers)

| # | Task | Files | Depends on |
|---|---|---|---|
| 47 | Response caching — `ADAPTERS_PROXY_CACHE=true` with SQLite/file cache for repeated dev prompts | `packages/adapters-proxy/` | — |
| 48 | Cost tracking — aggregate LiteLLM cost data, expose via `/metrics` | `packages/adapters-proxy/` | — |
| 49 | `--observe` mode — tee harness output to stdout (raw) + internal parser (cost/session tracking) without transforming output | `packages/cli/src/commands/launch.ts` | — |

---

## Summary

| Tier | Description | Count |
|---|---|---|
| 0 | Cleanup & fixes | 11 |
| 1 | Core infrastructure | 8 |
| 2 | Cloud transport endpoints | 5 |
| 3 | Provider coverage | 3 |
| 4 | Harness translation completeness | 5 |
| 5 | Launch orchestration | 3 |
| 6 | Test coverage | 5 |
| 7 | CI/CD & packaging | 3 |
| 8 | Docs | 3 |
| 9 | Future | 3 |
| **Total** | | **49** |

**Dependency highlights:**
- Tier 0 is all independent — can parallelize freely
- #13 (rich params) unblocks #14 (CLI args), #15 (dynamic providers), #35 (Router)
- #12 (CI env fix) unblocks all Python test work (#36-39, #41)
- #15 (dynamic detection) unblocks #25-27 (new providers)
- Transport endpoints (#20-23) are independent of each other
- Harness translators (#28-32) are independent of each other
- #33 (Ollama e2e) depends on #1 (dead code cleanup) and #8 (string matching fix)
