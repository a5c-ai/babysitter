# Kradle & Cloud Platform

Kradle is the Kubernetes-native deployment and management layer for the a5c platform.

## Components

| Package | Role |
|---------|------|
| `packages/kradle/core` | Kubernetes operator, resource model, data plane |
| `packages/kradle/web` | Next.js web UI for managing agents, repositories, workspaces |
| `packages/kradle/charts` | Helm charts and CRDs |
| `packages/kradle/sdk` | TypeScript SDK for API access |

## Resource Model

Kradle manages these Kubernetes custom resources:

- **Agent** — a deployed coding agent instance
- **Workspace** — an isolated execution environment
- **Repository** — a connected git repository
- **Secret** — credential storage
- **Policy** — access control and execution policies

## Web UI

The Kradle web UI provides:
- Repository management with issue tracking
- Agent stack builder (Atlas-driven)
- Workspace lifecycle (create, codespace, associations)
- External provider integration (sync, conflicts, write intents)
- Global search and command palette

## Deployment

Kradle deploys to AKS (Azure Kubernetes Service) via the atlas-driven deployment pipeline.

See the [kradle package](../../packages/kradle/) for implementation details.
