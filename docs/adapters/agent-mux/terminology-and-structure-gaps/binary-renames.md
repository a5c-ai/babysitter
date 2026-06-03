# Binary Renames

8 CLI binaries need alignment to `agent-mux-{feature}` pattern.

| Current Binary | Package | Target Binary | Notes |
|---------------|---------|--------------|-------|
| `adapters` | `@a5c-ai/adapters` (sdk) | `agent-mux` | Main CLI entry point |
| `adapters` | `@a5c-ai/adapters-cli` (cli) | `agent-mux` | Duplicate — merge with sdk or differentiate |
| `adapters-proxy` | `@a5c-ai/transport-adapter` | `agent-mux-transport-proxy` | Proxy server binary |
| `adapters-tui` | `@a5c-ai/tula-tui` | `agent-mux-tui` | Already close, just drop "adapters" prefix |
| `a5c-hooks-mux` | `@a5c-ai/hooks-adapter-cli` | `agent-mux-hooks` | Completely inconsistent currently |
| `extension-mux` | `@a5c-ai/extensions-adapter` | `agent-mux-extensions` | Add agent-mux prefix |
| `triggers-mux` | `@a5c-ai/triggers-adapter` | `agent-mux-triggers` | Add agent-mux prefix |
| `tasks-mux` | `@a5c-ai/tasks-adapter` | `agent-mux-tasks` | Add agent-mux prefix |
| `mock-harness` | `@a5c-ai/adapters-harness-mock` | `agent-mux-harness-mock` | Add agent-mux prefix |

## Backward Compatibility

Each renamed binary should keep the old name as a deprecated alias for one major version cycle. The alias should print a warning:
```
[agent-mux] "adapters" is deprecated, use "agent-mux" instead.
```
