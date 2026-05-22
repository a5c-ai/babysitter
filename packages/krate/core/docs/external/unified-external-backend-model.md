# Unified external backend model

## Purpose

Krate needs one provider model that can represent GitHub and future externally managed systems without assuming every backend is a full Git forge. A backend can support any combination of three provider interfaces:

- issue tracking;
- CI/CD;
- git forge.

## Provider capability model

```yaml
kind: ExternalBackendProvider
spec:
  organizationRef: a5c
  providerType: github
  displayName: GitHub a5c-ai
  baseUrl: https://github.com
  apiBaseUrl: https://api.github.com
  capabilities:
    issueTracking: true
    cicd: true
    gitForge: true
  authRef:
    kind: Secret
    name: github-app-a5c
  syncPolicyRef: github-default-sync
```

Provider capability does not mean every repository enables every capability. `ExternalBackendBinding` controls which Krate repositories or org scopes use which interface.

## Three unified interfaces

| Interface | Krate domain | GitHub example | Other provider examples |
| --- | --- | --- | --- |
| Issue tracking | `Issue`, comments, labels, milestones, project/work-item fields | GitHub Issues/Projects | Jira, Linear, Azure Boards. |
| CI/CD | `Pipeline`, `Job`, checks, triggers, runners, artifacts/logs | GitHub Actions/Checks | Buildkite, CircleCI, Jenkins, Azure Pipelines. |
| Git forge | `Repository`, `PullRequest`, refs, commits, keys, collaborators, branch protection | GitHub repositories and PRs | GitLab, Bitbucket, Gitea, raw Git + custom PR layer. |

## Ownership modes

| Mode | Meaning |
| --- | --- |
| `external-owned` | external backend is source of truth; Krate mirrors and can request changes through provider API. |
| `krate-owned` | Krate owns desired state and reconciles it to the provider. |
| `bidirectional` | both systems may change state; conflicts are detected and resolved by policy or user review. |
| `read-only` | Krate only imports state and never writes. |
| `write-through` | user changes in Krate are immediately applied to provider after admission. |
| `reviewed-write` | user/agent changes create a proposed change requiring approval. |

Ownership is configured per interface and sometimes per resource type. For example, GitHub can be external-owned for PR discussions, Krate-owned for deploy keys, and bidirectional for labels.

## External identity fields

Every synced resource should store:

```yaml
external:
  providerRef: github-a5c
  interface: gitForge
  nativeId: "123456"
  nativeNumber: 42
  nodeId: PR_kwDO...
  url: https://github.com/a5c-ai/krate/pull/42
  apiUrl: https://api.github.com/repos/a5c-ai/krate/pulls/42
  etag: W/"..."
  cursor: opaque-cursor
  lastSeenAt: 2026-05-11T12:00:00Z
  lastSyncedAt: 2026-05-11T12:00:05Z
  resourceVersion: provider-specific-version
```

`nodeId` is optional but preferred for GitHub because REST and GraphQL can both reference global node IDs.

## Binding model

```yaml
kind: ExternalBackendBinding
spec:
  organizationRef: a5c
  providerRef: github-a5c
  targetRef:
    kind: Repository
    name: krate
  interfaces:
    issueTracking:
      enabled: true
      mode: bidirectional
    cicd:
      enabled: true
      mode: external-owned
    gitForge:
      enabled: true
      mode: bidirectional
  externalRef:
    owner: a5c-ai
    repository: krate
```

## Acceptance criteria

- A provider can support one, two, or all three interfaces.
- Krate resources preserve external native IDs and cursors.
- Sync mode is explicit by interface.
- Cross-org provider bindings are rejected unless an org sharing policy admits them.
- UI can explain whether an action is local, mirrored, write-through, or reviewed-write.
