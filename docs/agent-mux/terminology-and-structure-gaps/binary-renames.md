# Binary Renames

8 CLI binaries need alignment to `agent-mux-{feature}` pattern.

| Current Binary | Package | Target Binary | Notes |
|---------------|---------|--------------|-------|
| `amux` | `@a5c-ai/agent-mux` (sdk) | `agent-mux` | Main CLI entry point |
| `amux` | `@a5c-ai/agent-mux-cli` (cli) | `agent-mux` | Duplicate — merge with sdk or differentiate |
| `amux-proxy` | `@a5c-ai/agent-mux-transport` | `agent-mux-transport-proxy` | Proxy server binary |
| `amux-tui` | `@a5c-ai/agent-mux-tui` | `agent-mux-tui` | Already close, just drop "amux" prefix |
| `a5c-hooks-mux` | `@a5c-ai/agent-mux-hooks-cli` | `agent-mux-hooks` | Completely inconsistent currently |
| `extension-mux` | `@a5c-ai/agent-mux-extensions` | `agent-mux-extensions` | Add agent-mux prefix |
| `triggers-mux` | `@a5c-ai/agent-mux-triggers` | `agent-mux-triggers` | Add agent-mux prefix |
| `tasks-mux` | `@a5c-ai/agent-mux-tasks` | `agent-mux-tasks` | Add agent-mux prefix |
| `mock-harness` | `@a5c-ai/agent-mux-harness-mock` | `agent-mux-harness-mock` | Add agent-mux prefix |

## Backward Compatibility

Each renamed binary should keep the old name as a deprecated alias for one major version cycle. The alias should print a warning:
```
[agent-mux] "amux" is deprecated, use "agent-mux" instead.
```
