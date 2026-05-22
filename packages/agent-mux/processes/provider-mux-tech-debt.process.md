# Provider Mux Tech Debt Process

## Goal
Complete remaining tech debt items from the provider-mux/launcher feature implementation.

## Phases

### Phase 1: TypeScript Quality & Robustness
- Windows signal handling (`taskkill` fallback)
- Proxy process cleanup via ProcessTracker
- `translateProvider` as optional adapter interface method
- Config file permissions check

### Phase 2: Python amux-proxy Improvements
- `/v1/models` endpoint for provider model discovery
- Ollama server lifecycle management (start/stop)
- `/v1/count_tokens` token estimation endpoint

### Phase 3: CLI Extensions
- `amux models --provider` / `--harness` filtering
- Ollama model pre-check before launch
- Root package.json scripts for amux-proxy

### Verification Gate
Full TypeScript + Python test suite run.

### Review Gate
Code review with refinement loop (target score: 85).

### Final Approval
User breakpoint before completion.
