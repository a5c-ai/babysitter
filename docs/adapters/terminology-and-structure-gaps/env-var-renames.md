# Environment Variable Renames

348+ references to `ADAPTER_*` environment variables need renaming to `AGENT_MUX_*`.

## Mapping

| Current | Target | Files | Usage |
|---------|--------|-------|-------|
| `ADAPTER_PROVIDER` | `AGENT_MUX_PROVIDER` | 50+ | Provider selection (foundry, google, anthropic) |
| `ADAPTER_API_BASE` | `AGENT_MUX_API_BASE` | 40+ | API endpoint base URL |
| `ADAPTER_API_KEY` | `AGENT_MUX_API_KEY` | 30+ | API authentication key |
| `ADAPTER_MODEL` | `AGENT_MUX_MODEL` | 30+ | Default model selection |
| `ADAPTER_REGION` | `AGENT_MUX_REGION` | 10+ | Cloud region |
| `ADAPTER_PROJECT` | `AGENT_MUX_PROJECT` | 10+ | Cloud project ID |
| `ADAPTER_PROFILE` | `AGENT_MUX_PROFILE` | 10+ | Configuration profile name |
| `ADAPTER_LOG_LEVEL` | `AGENT_MUX_LOG_LEVEL` | 5+ | Logging verbosity |
| `ADAPTER_LOG_FILE` | `AGENT_MUX_LOG_FILE` | 5+ | Log file path |
| `ADAPTER_LOG_PRETTY` | `AGENT_MUX_LOG_PRETTY` | 3+ | Pretty-print logs |
| `ADAPTER_OBSERVABILITY_MODE` | `AGENT_MUX_OBSERVABILITY_MODE` | 3+ | Observability configuration |
| `ADAPTERS_PROXY_AUTH_TOKEN` | `AGENT_MUX_PROXY_AUTH_TOKEN` | 5+ | Transport proxy auth |
| `ADAPTERS_PROXY_PORT` | `AGENT_MUX_PROXY_PORT` | 3+ | Proxy listen port |
| `ADAPTER_MOCK_HARNESS_BIN` | `AGENT_MUX_MOCK_HARNESS_BIN` | 3+ | Mock harness binary path |
| `ADAPTER_REMOTE_AGENT` | `AGENT_MUX_REMOTE_AGENT` | 3+ | Remote agent adapter name |

## Backward Compatibility

Read both old and new env vars with preference for new:
```typescript
const provider = process.env.AGENT_MUX_PROVIDER ?? process.env.ADAPTER_PROVIDER;
```
Log deprecation warning when old var is used.

## CI/CD Updates

All `.github/workflows/*.yml` files that set `ADAPTER_*` env vars need updating.
All `action.yml` and pipeline templates (Azure, GitLab, etc.) in `packages/triggers-adapter/` need updating.
