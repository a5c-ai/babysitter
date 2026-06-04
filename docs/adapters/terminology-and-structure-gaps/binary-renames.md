# Binary Renames

8 CLI binaries need alignment to `adapters-{feature}` pattern.

| Current Binary | Package | Target Binary | Notes |
|---------------|---------|--------------|-------|
| `adapters` | `@a5c-ai/adapters` (sdk) | `adapters` | Main CLI entry point |
| `adapters` | `@a5c-ai/adapters-cli` (cli) | `adapters` | Duplicate — merge with sdk or differentiate |
| `adapters-proxy` | `@a5c-ai/transport-adapter` | `adapters-transport-proxy` | Proxy server binary |
| `adapters-tui` | `@a5c-ai/tula-tui` | `adapters-tui` | Already close, just drop "adapters" prefix |
| `a5c-hooks-mux` | `@a5c-ai/hooks-adapter-cli` | `adapters-hooks` | Completely inconsistent currently |
| `extension-mux` | `@a5c-ai/extensions-adapter` | `adapters-extensions` | Add adapters prefix |
| `triggers-mux` | `@a5c-ai/triggers-adapter` | `adapters-triggers` | Add adapters prefix |
| `tasks-mux` | `@a5c-ai/tasks-adapter` | `adapters-tasks` | Add adapters prefix |
| `mock-harness` | `@a5c-ai/adapters-harness-mock` | `adapters-harness-mock` | Add adapters prefix |

## Backward Compatibility

Each renamed binary should keep the old name as a deprecated alias for one major version cycle. The alias should print a warning:
```
[adapters] "adapters" is deprecated, use "adapters" instead.
```
