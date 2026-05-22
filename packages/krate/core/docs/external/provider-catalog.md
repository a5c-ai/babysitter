# Pluggable backend provider catalog

## Purpose

This catalog lists likely external backend integrations and how each maps to Krate's three unified interfaces:

1. issue tracking;
2. CI/CD;
3. git forge.

A backend can support one, two, or all three. Provider implementations should be capability-driven rather than hard-coded to GitHub semantics.

## Provider matrix

| Provider | Issue tracking | CI/CD | Git forge | Notes |
| --- | --- | --- | --- | --- |
| GitHub | yes | yes | yes | first full provider; GitHub Apps, REST, GraphQL, webhooks, Actions, Checks. |
| GitLab | yes | yes | yes | issues, merge requests, pipelines/jobs, webhooks, project/group APIs; supports SaaS and self-managed. |
| Bitbucket Cloud | limited/yes | yes | yes | repositories, pull requests, pipelines, webhooks; issue support depends on workspace/repo configuration. |
| Bitbucket Data Center | limited/yes | external/limited | yes | repo/PR APIs and webhooks; CI often external Jenkins/Bamboo. |
| Azure DevOps | yes | yes | yes | Work Items, Boards, Git repos/PRs, Pipelines, service hooks. |
| Jira Cloud/Data Center | yes | no | no | work items/issues only; pairs well with GitHub/GitLab/Bitbucket or CI-only providers. |
| Linear | yes | no | no | GraphQL issue/workflow model and webhooks; no native git forge. |
| Buildkite | no | yes | no | builds, jobs, agents, artifacts, webhooks; pairs with GitHub/GitLab/Bitbucket. |
| CircleCI | no | yes | no | pipelines, workflows, jobs, webhooks, artifacts; pairs with git forge providers. |
| Jenkins | no | yes | no | jobs/builds/logs via remote API; webhook support usually plugin-specific. |
| Gitea | yes | limited/external | yes | current internal/default forge path; can also be external-managed. |
| Gerrit | no/limited | no | yes | code review and Git refs; often pairs with Jenkins/Buildkite. |
| Raw Git server | no | no | partial | clone/fetch/push/refs only; no issue/PR semantics unless paired. |
| Custom webhook backend | optional | optional | optional | provider adapter can normalize proprietary events into one interface. |

## Provider profiles

### Full forge providers

Full forge providers typically implement all three interfaces:

- GitHub;
- GitLab;
- Azure DevOps;
- partially Bitbucket when issue and pipeline features are enabled.

These providers can power repository pages end to end, but Krate should still let each interface be enabled independently.

### Work tracking providers

Work tracking providers implement issue tracking only:

- Jira;
- Linear;
- Azure Boards if used separately from Azure Repos/Pipelines;
- custom ticket systems.

Krate maps these into issues/work items, labels, project fields, comments, assignees, and issue-triggered agent dispatch.

### CI/CD providers

CI/CD providers implement pipeline/job/run functionality only:

- Buildkite;
- CircleCI;
- Jenkins;
- Azure Pipelines if used separately;
- GitHub Actions if GitHub forge is not used;
- GitLab CI if GitLab forge is not used.

Krate maps these into `Pipeline`, `Job`, logs, artifacts, checks, runners, and triggers.

### Git forge providers

Git forge providers implement repos/PRs/refs/keys but may not own issues or CI:

- GitHub;
- GitLab;
- Bitbucket;
- Gitea;
- Gerrit;
- raw Git with limited semantics.

Krate maps these into repositories, pull requests/reviews, refs, commits, deploy keys, repository permissions, and branch protection.

## Capability descriptor

Each provider adapter should expose a descriptor:

```yaml
providerType: gitlab
version: v1
interfaces:
  issueTracking:
    supported: true
    operations: [list, get, create, update, comment, label, transition]
    webhookEvents: [issue, note]
  cicd:
    supported: true
    operations: [listRuns, getRun, listJobs, getLog, retry, cancel]
    webhookEvents: [pipeline, job]
  gitForge:
    supported: true
    operations: [listRepos, getRepo, listPullRequests, createPullRequest, merge, listRefs]
    webhookEvents: [push, mergeRequest, tagPush]
authModes: [oauth-app, personal-token, project-token, self-managed-token]
hosting: [saas, self-managed]
rateLimitModel: provider-specific
```

## Provider-specific notes

### GitLab

GitLab should support issues, merge requests, pipelines/jobs, project/group webhooks, branches/tags, approvals, protected branches, deploy keys, and self-managed base URLs.

### Bitbucket

Bitbucket should separate Cloud and Data Center adapters because authentication, APIs, webhook payloads, and feature availability differ.

### Jira

Jira issue payloads use Atlassian Document Format for rich text in Cloud REST v3. Krate needs a markdown/ADF conversion layer for issue body/comments.

### Linear

Linear is GraphQL-first and issue/workflow-oriented. It should support issue tracking with webhooks and a provider-specific field mapping for teams, cycles, projects, states, and labels.

### Azure DevOps

Azure DevOps can support all three interfaces, but Work Items, Git repos/PRs, Pipelines, and Service Hooks are separate service areas. Krate should model them under one provider with separate interface credentials/scopes where needed.

### Buildkite/CircleCI/Jenkins

These are CI/CD-only providers. They should map to `Pipeline`/`Job` and can be paired with GitHub/GitLab/Bitbucket/Gitea for repo and PR context.

## Acceptance criteria

- Provider adapter selection is capability-driven.
- A single Krate repository can bind different providers per interface.
- A provider can be self-managed with custom base URLs.
- UI can explain unsupported operations before a user clicks them.
- Tests can run provider contract suites against fake adapters for each interface.
