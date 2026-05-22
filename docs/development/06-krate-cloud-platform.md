# Krate & Cloud Platform

Krate is the Kubernetes-native deployment and management layer for the a5c platform.

## Components

| Package | Role |
|---------|------|
| `packages/krate/core` | Kubernetes operator, resource model, data plane |
| `packages/krate/web` | Next.js web UI for managing agents, repositories, workspaces |
| `packages/krate/charts` | Helm charts and CRDs |
| `packages/krate/sdk` | TypeScript SDK for API access |

## Resource Model

Krate manages these Kubernetes custom resources:

- **Agent** — a deployed coding agent instance
- **Workspace** — an isolated execution environment
- **Repository** — a connected git repository
- **Secret** — credential storage
- **Policy** — access control and execution policies

## Web UI

The Krate web UI provides:
- Repository management with issue tracking
- Agent stack builder (Atlas-driven)
- Workspace lifecycle (create, codespace, associations)
- External provider integration (sync, conflicts, write intents)
- Global search and command palette

## Deployment

Krate deploys to AKS (Azure Kubernetes Service) via the atlas-driven deployment pipeline.

See the [krate package](../../packages/krate/) for implementation details.
