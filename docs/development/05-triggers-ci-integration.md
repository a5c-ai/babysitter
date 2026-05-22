# Triggers & CI Integration

The `@a5c-ai/triggers` package provides a GitHub Action and CLI for running coding agents from CI pipelines.

## Architecture

```mermaid
graph LR
    subgraph "CI Event"
        GH["GitHub Event<br/>(push, PR, issue, schedule)"]
    end

    subgraph "Triggers Action"
        ENRICH["Enrich<br/>(normalize + fetch changes)"]
        EVAL["Evaluate<br/>(trigger query match)"]
        SETUP["Setup<br/>(install harness + plugin)"]
        LAUNCH["Launch<br/>(amux launch)"]
    end

    GH --> ENRICH --> EVAL
    EVAL -->|matched| SETUP --> LAUNCH
    EVAL -->|no match| SKIP["Skip"]
```

## Invocation Modes

| Mode | Flags | Use Case |
|------|-------|----------|
| `non-interactive` | `--no-interactive` | Simple one-shot tasks |
| `bridged-hooks` | `--no-interactive --bridge-hooks` | Babysitter orchestrated tasks |
| `bridged-interactive` | `--no-interactive --bridge-interactive` | Tool-heavy tasks needing PTY |

## Supported Harnesses

All harnesses from the atlas graph: claude, codex, pi, gemini, copilot, cursor, opencode, hermes.

## Babysitter Plugin Integration

When `babysitter-plugin: true`, the action:
1. Generates per-harness plugins
2. Installs babysitter SDK
3. Installs plugin into harness
4. Copies process file to `.a5c/processes/`
5. Launches with bridge flags

See [triggers README](../../packages/triggers/README.md) for full input reference and examples.
