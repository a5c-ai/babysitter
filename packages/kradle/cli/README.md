# @a5c-ai/kradle-cli

CLI and MCP (Model Context Protocol) server for the Kradle Kubernetes-native forge platform.

## Installation

```bash
npm install -g @a5c-ai/kradle-cli
```

Or run directly via npx:

```bash
npx @a5c-ai/kradle-cli serve
npx @a5c-ai/kradle-cli mcp
```

## Commands

### `kradle serve`

Start the Kradle HTTP API server on port 3080 (default).

```bash
kradle serve
```

The server exposes:
- `GET /api/controller` — full Kubernetes snapshot
- `GET /api/orgs` — list organizations
- `GET /api/orgs/:org/repositories` — list repositories
- `GET|POST /api/orgs/:org/resources` — list or apply resources
- `GET|DELETE /api/orgs/:org/resources/:kind/:name` — get or delete a resource
- `POST /api/orgs/:org/agents/dispatch` — dispatch an agent run
- `GET /api/watch/orgs/:org/:resource` — Server-Sent Events watch stream

### `kradle mcp`

Start the Kradle MCP server over stdio (JSON-RPC 2.0). Suitable for use as a Claude Desktop tool server or any MCP-compatible client.

```bash
kradle mcp
```

### `kradle help`

Print available commands and environment variables.

```bash
kradle help
```

## MCP Server

The MCP server (`kradle mcp`) exposes 14 tools over stdio:

| Tool | Description |
|------|-------------|
| `kradle_list_resources` | List resources of a given kind (e.g. `AgentStack`, `Repository`) |
| `kradle_get_resource` | Get a single resource by kind and name |
| `kradle_apply_resource` | Create or update a resource (kubectl apply semantics) |
| `kradle_delete_resource` | Delete a resource by kind and name |
| `kradle_snapshot` | Get the full organization runtime snapshot |
| `kradle_search` | Full-text search across all resources in the snapshot |
| `kradle_list_stacks` | List all AgentStack resources |
| `kradle_dispatch_agent` | Dispatch an agent run against an AgentStack |
| `kradle_list_secrets` | List AgentSecretGrant resources, optionally filtered by org |
| `kradle_create_secret` | Create an AgentSecretGrant resource |
| `kradle_create_stack` | Create an AgentStack resource |
| `kradle_sync_external` | Trigger an external sync for a backend binding |
| `kradle_resolve_conflict` | Resolve an external sync conflict |
| `kradle_audit_query` | Query audit events with optional org/action/time filters |

### MCP Client Configuration (Claude Desktop)

```json
{
  "mcpServers": {
    "kradle": {
      "command": "kradle",
      "args": ["mcp"],
      "env": {
        "KRADLE_NAMESPACE": "kradle-system",
        "KRADLE_ORG": "default"
      }
    }
  }
}
```

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `KRADLE_NAMESPACE` | `kradle-system` | Kubernetes namespace for the Kradle control plane |
| `KRADLE_ORG` | `default` | Default organization slug |
| `KRADLE_ADMIN_ORG` | — | Admin organization slug (used for fallback namespace resolution) |
| `KRADLE_KUBECTL` | `kubectl` | Path to the kubectl binary |
| `KRADLE_KUBECTL_TIMEOUT_MS` | `3000` | kubectl command timeout in milliseconds |
| `KRADLE_KUBECTL_MAX_BUFFER_BYTES` | `33554432` | Max stdout buffer for kubectl (32 MB) |
| `KRADLE_CONTROLLER_URL` | — | URL of a remote controller API (used instead of direct kubectl) |
| `KRADLE_SNAPSHOT_CACHE_TTL_MS` | `10000` | Snapshot cache TTL in milliseconds |
| `KRADLE_KUBEVELA_NAMESPACE` | `vela-system` | KubeVela namespace |
| `KRADLE_KYVERNO_ENABLED` | — | Set to `true` to enable Kyverno policy discovery |
| `KRADLE_KYVERNO_NAMESPACE` | `kyverno` | Kyverno controller namespace |
| `KRADLE_KYVERNO_POLICY_NAMESPACE` | `kradle-system` | Namespace for Kyverno policies |
| `KRADLE_GITEA_URL` | — | Base URL for the Gitea git backend |
| `KRADLE_GITEA_TOKEN` | — | Admin token for the Gitea API |
| `KUBECONFIG` | — | Path to kubeconfig file (disables in-cluster config) |
| `KUBERNETES_SERVICE_HOST` | — | In-cluster API server host (set automatically by Kubernetes) |
| `KUBERNETES_SERVICE_PORT` | `443` | In-cluster API server port |
