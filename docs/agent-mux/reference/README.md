# agent-mux reference

This directory is the canonical API and behavior reference for `@a5c-ai/agent-mux`.

## Normative reference set

| # | Doc | What it covers |
|---|---|---|
| 01 | [core-types-and-client.md](01-core-types-and-client.md) | `AgentMuxClient`, registry, core types |
| 02 | [run-options-and-profiles.md](02-run-options-and-profiles.md) | `RunOptions`, profiles, defaults |
| 03 | [run-handle-and-interaction.md](03-run-handle-and-interaction.md) | `RunHandle` API, stdin injection, cancel |
| 04 | [agent-events.md](04-agent-events.md) | The `AgentEvent` union and streaming contract |
| 05 | [adapter-system.md](05-adapter-system.md) | `BaseAgentAdapter`, registration, adapter responsibilities |
| 06 | [capabilities-and-models.md](06-capabilities-and-models.md) | `AgentCapabilities`, `ModelCapabilities` |
| 07 | [session-manager.md](07-session-manager.md) | Session discovery, resume, fork |
| 08 | [config-and-auth.md](08-config-and-auth.md) | Config files, auth detection, guidance |
| 09 | [plugin-manager.md](09-plugin-manager.md) | MCP plugin management |
| 10 | [cli-reference.md](10-cli-reference.md) | `amux` CLI commands |
| 11 | [process-lifecycle-and-platform.md](11-process-lifecycle-and-platform.md) | Spawn, cleanup, PTY, platform matrix |
| 12 | [built-in-adapters.md](12-built-in-adapters.md) | Built-in adapter behavior and per-agent differences |
| 13 | [invocation-modes.md](13-invocation-modes.md) | Invocation modes such as `local`, `docker`, `ssh`, `k8s` |
| 14 | [harness-mock.md](14-harness-mock.md) | Mock harness package and scenarios |
| 15 | [hooks.md](15-hooks.md) | Hook system, native hooks, virtual hooks |

## Per-agent reference

Per-agent adapter notes live in [agents/](agents/):

- [Claude](agents/claude.md)
- [Codex](agents/codex.md)
- [Gemini](agents/gemini.md)
- [Cursor](agents/cursor.md)
- [Copilot](agents/copilot.md)
- [OpenCode](agents/opencode.md)
- [OpenClaw](agents/openclaw.md)
- [Pi](agents/pi.md)
- [omp](agents/omp.md)
- [Hermes](agents/hermes.md)
- [Qwen](agents/qwen.md)
- [amp](agents/amp.md)
- [droid](agents/droid.md)
- [agent-mux-remote](agents/agent-mux-remote.md)

## Usage rule

Treat this directory as the source of truth for current package behavior. Tutorials and archived documents may explain or compare the system, but they do not override anything here.
