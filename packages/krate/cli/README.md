# @a5c-ai/krate-cli

CLI and MCP (Model Context Protocol) server for the Krate Kubernetes-native forge platform.

## Installation

```bash
npm install -g @a5c-ai/krate-cli
```

Or run directly via npx:

```bash
npx @a5c-ai/krate-cli serve
npx @a5c-ai/krate-cli mcp
```

## Commands

### `krate serve`

Start the Krate HTTP API server on port 3080 (default).

```bash
krate serve
```

The server exposes:
- `GET /api/controller` — full Kubernetes snapshot
- `GET /api/orgs` — list organizations
- `GET /api/orgs/:org/repositories` — list repositories
- `GET|POST /api/orgs/:org/resources` — list or apply resources
- `GET|DELETE /api/orgs/:org/resources/:kind/:name` — get or delete a resource
- `POST /api/orgs/:org/agents/dispatch` — dispatch an agent run
- `GET /api/watch/orgs/:org/:resource` — Server-Sent Events watch stream

### `krate mcp`

Start the Krate MCP server over stdio (JSON-RPC 2.0). Suitable for use as a Claude Desktop tool server or any MCP-compatible client.

```bash
krate mcp
```

### `krate help`

Print available commands and environment variables.

```bash
krate help
```

## MCP Server

The MCP server (`krate mcp`) exposes 14 tools over stdio:

| Tool | Description |
|------|-------------|
| `krate_list_resources` | List resources of a given kind (e.g. `AgentStack`, `Repository`) |
| `krate_get_resource` | Get a single resource by kind and name |
| `krate_apply_resource` | Create or update a resource (kubectl apply semantics) |
| `krate_delete_resource` | Delete a resource by kind and name |
| `krate_snapshot` | Get the full organization runtime snapshot |
| `krate_search` | Full-text search across all resources in the snapshot |
| `krate_list_stacks` | List all AgentStack resources |
| `krate_dispatch_agent` | Dispatch an agent run against an AgentStack |
| `krate_list_secrets` | List AgentSecretGrant resources, optionally filtered by org |
| `krate_create_secret` | Create an AgentSecretGrant resource |
| `krate_create_stack` | Create an AgentStack resource |
| `krate_sync_external` | Trigger an external sync for a backend binding |
| `krate_resolve_conflict` | Resolve an external sync conflict |
| `krate_audit_query` | Query audit events with optional org/action/time filters |

### MCP Client Configuration (Claude Desktop)

```json
{
  "mcpServers": {
    "krate": {
      "command": "krate",
      "args": ["mcp"],
      "env": {
        "KRATE_NAMESPACE": "krate-system",
        "KRATE_ORG": "default"
      }
    }
  }
}
```

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `KRATE_NAMESPACE` | `krate-system` | Kubernetes namespace for the Krate control plane |
| `KRATE_ORG` | `default` | Default organization slug |
| `KRATE_ADMIN_ORG` | — | Admin organization slug (used for fallback namespace resolution) |
| `KRATE_KUBECTL` | `kubectl` | Path to the kubectl binary |
| `KRATE_KUBECTL_TIMEOUT_MS` | `3000` | kubectl command timeout in milliseconds |
| `KRATE_KUBECTL_MAX_BUFFER_BYTES` | `33554432` | Max stdout buffer for kubectl (32 MB) |
| `KRATE_CONTROLLER_URL` | — | URL of a remote controller API (used instead of direct kubectl) |
| `KRATE_SNAPSHOT_CACHE_TTL_MS` | `10000` | Snapshot cache TTL in milliseconds |
| `KRATE_KUBEVELA_NAMESPACE` | `vela-system` | KubeVela namespace |
| `KRATE_KYVERNO_ENABLED` | — | Set to `true` to enable Kyverno policy discovery |
| `KRATE_KYVERNO_NAMESPACE` | `kyverno` | Kyverno controller namespace |
| `KRATE_KYVERNO_POLICY_NAMESPACE` | `krate-system` | Namespace for Kyverno policies |
| `KRATE_GITEA_URL` | — | Base URL for the Gitea git backend |
| `KRATE_GITEA_TOKEN` | — | Admin token for the Gitea API |
| `KUBECONFIG` | — | Path to kubeconfig file (disables in-cluster config) |
| `KUBERNETES_SERVICE_HOST` | — | In-cluster API server host (set automatically by Kubernetes) |
| `KUBERNETES_SERVICE_PORT` | `443` | In-cluster API server port |
