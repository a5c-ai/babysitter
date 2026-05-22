# External object mapping spec

## Purpose

This document defines canonical object mappings between provider-native objects and Krate resources. The goal is loss-aware sync: Krate should preserve provider identity and important provider-specific fields even when not all fields fit a first-class Krate resource.

## Mapping principles

- Preserve native ID, URL, node/global ID, and provider version fields.
- Normalize common fields into Krate resources.
- Store unsupported provider-specific fields in an extension map with schema version.
- Avoid lossy writes unless the user explicitly accepts field loss.
- Keep provider-specific rich text formats as source plus rendered Markdown/HTML where safe.

## Common external envelope

```yaml
external:
  providerRef: github-a5c
  bindingRef: github-krate
  interface: gitForge
  nativeKind: pull_request
  nativeId: "123456"
  nativeNumber: 42
  nodeId: PR_kwDO...
  url: https://github.com/a5c-ai/krate/pull/42
  apiUrl: https://api.github.com/repos/a5c-ai/krate/pulls/42
  version:
    etag: W/"..."
    updatedAt: 2026-05-11T12:00:00Z
    sha: abcdef1234
  extensions:
    providerType: github
    schemaVersion: github-rest-2022-11-28
    fields: {}
```

## Issue mapping

| Provider field | Krate field |
| --- | --- |
| title | `Issue.spec.title` |
| body/description | `Issue.spec.body` plus `external.extensions.bodyFormat` |
| state/status | `Issue.status.phase` and `Issue.spec.state` |
| labels | `Issue.metadata.labels` and issue label projection |
| assignees | `Issue.spec.assignees` via identity mapping |
| milestone/sprint/cycle | `Issue.spec.milestone` or extension |
| comments | issue activity/comment projection |
| timestamps | `status.createdAt`, `status.updatedAt`, `status.closedAt` |

Provider notes:

- Jira status transitions need a transition operation, not a simple `state` patch.
- Linear workflow states map to issue phase plus provider extension.
- GitHub PR-backed issues link to `PullRequest`.

## Pipeline mapping

| Provider field | Krate field |
| --- | --- |
| workflow/pipeline name | `Pipeline.spec.workflow` |
| run/build ID | `Pipeline.external.nativeId` |
| branch/ref | `Pipeline.spec.ref` |
| sha | `Pipeline.spec.sha` |
| status/conclusion | `Pipeline.status.phase` and `status.conclusion` |
| jobs | `Job` projections |
| logs | lazy `Artifact`/log ref |
| artifacts | `AgentArtifact`/`Artifact` projection by digest or native URL |
| rerun/cancel | `ExternalWriteIntent` operation |

## Pull request mapping

| Provider field | Krate field |
| --- | --- |
| title/body | `PullRequest.spec.title/body` |
| number/IID | `external.nativeNumber` |
| source branch | `PullRequest.spec.head` |
| target branch | `PullRequest.spec.base` |
| head SHA | `PullRequest.status.headSha` |
| merge state | `PullRequest.status.mergeState` |
| reviewers/reviews | `Review` projections |
| checks | linked `Pipeline`/`Job`/check projections |
| labels/assignees | shared issue-like fields where provider supports them |

## Repository mapping

| Provider field | Krate field |
| --- | --- |
| owner/name/path | `Repository.metadata.name`, `spec.external.owner/path` |
| visibility | `Repository.spec.visibility` |
| default branch | `Repository.spec.defaultBranch` |
| clone URLs | `Repository.status.cloneUrls` |
| archived/disabled | `Repository.status.phase` and extension |
| permissions/collaborators | `RepositoryPermission` projections |
| deploy keys | `SSHKey`/deploy-key projections |
| branch protection | `BranchProtection`/`RefPolicy` projections |

## Rich text conversion

Providers may use different body formats:

- Markdown: GitHub, GitLab, many Git forges;
- Atlassian Document Format: Jira Cloud;
- provider-specific markdown extensions: Linear/GitLab;
- HTML fragments: some legacy systems.

Krate stores:

```yaml
body:
  markdown: safe normalized markdown
  sourceFormat: atlassian-document-format
  sourceDigest: sha256:...
  renderWarnings: []
```

Writes should preserve source format when possible or mark conversion loss.

## Acceptance criteria

- Every synced object has an external envelope.
- Unsupported provider fields are retained in extensions.
- Writes do not silently drop unsupported fields.
- Rich text conversion is explicit and testable.
- Mapping docs are used by provider contract tests.
