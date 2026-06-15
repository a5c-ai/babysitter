# @a5c-ai/hooks-adapter-antigravity

Google Antigravity CLI harness adapter for the hooks-adapter system.

Normalizes Antigravity's workflow-driven hook events into the unified babysitter hook protocol, enabling lifecycle hooks, session tracking, and plugin integration for the Antigravity CLI agent.

## Adapter Family

`workflow-hook` — Antigravity uses workflow-driven orchestration rather than shell-script hooks.

## Supported Events

| Native Event | Canonical Phase |
|---|---|
| BeforeToolSelection | turn.pre-tool-selection |
| BeforeModel | turn.pre-model |
| AfterModel | turn.post-model |
| BeforeAgent | session.pre-agent |
| AfterAgent | session.post-agent |
| BeforeTool | turn.pre-tool |
| AfterTool | turn.post-tool |
