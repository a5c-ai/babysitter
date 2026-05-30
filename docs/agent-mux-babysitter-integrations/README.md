# Agent-Mux ↔ Babysitter Integration

Design documents for integrating agent-mux capabilities into the babysitter SDK, enabling processes to discover available agents/models and dispatch work to external harnesses.

## Documents

### Standalone Mode (omni, agent-platform CLI)
1. [**overview.md**](./overview.md) — Architecture overview and capability summary
2. [**sdk-discovery.md**](./sdk-discovery.md) — SDK-level agent-mux discovery (harnesses, models, capabilities)
3. [**external-agent-tasks.md**](./external-agent-tasks.md) — New `agent` task kind with `external` flag for agent-mux dispatch
4. [**effect-resolution.md**](./effect-resolution.md) — Effect resolution pipeline changes (SDK → agent-platform → agent-mux)
5. [**process-authoring.md**](./process-authoring.md) — Process creation instruction updates (prompts, templates, validation)

### Plugin Mode (babysitter running inside claude-code, codex, gemini-cli, etc.)
6. [**plugin-mode.md**](./plugin-mode.md) — Plugin integration gaps: cross-agent dispatch from within host agents, host tool discovery, effect cancellation, subprocess support

### Shared
7. [**testing.md**](./testing.md) — Test strategy across all layers and both modes
