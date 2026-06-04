# Agent-Mux ↔ Babysitter Integration

Design documents for integrating adapters capabilities into the babysitter SDK, enabling processes to discover available agents/models and dispatch work to external harnesses.

## Documents

### Architecture
1. [**overview.md**](./overview.md) — Architecture overview and capability summary
2. [**tasks-mux-routing.md**](./tasks-mux-routing.md) — **Core design:** tasks-mux as unified routing hub for all task types (human, agent, tracker, internal) — covers both standalone and plugin modes

### Standalone Mode (genty, agent-platform CLI)
3. [**sdk-discovery.md**](./sdk-discovery.md) — SDK-level adapters discovery (harnesses, models, capabilities)
4. [**external-agent-tasks.md**](./external-agent-tasks.md) — New `agent` task kind with `external` flag for adapters dispatch
5. [**effect-resolution.md**](./effect-resolution.md) — Effect resolution pipeline changes (SDK → tasks-mux → adapters)
6. [**process-authoring.md**](./process-authoring.md) — Process creation instruction updates (prompts, templates, validation)

### Plugin Mode (babysitter running inside claude-code, codex, gemini-cli, etc.)
7. [**plugin-mode.md**](./plugin-mode.md) — Plugin integration gaps: cross-agent dispatch from within host agents, host tool discovery, effect cancellation, subprocess support

### Shared
8. [**testing.md**](./testing.md) — Test strategy across all layers and both modes
