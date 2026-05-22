# Provider capability manifests

## Purpose

Provider manifests make external backend support data-driven. Each adapter declares supported interfaces, operations, auth modes, webhook events, rate-limit model, object identity fields, and unsupported features. Krate uses the manifest to render UI, validate CRDs, run contract tests, and disable unsupported actions.

## Manifest schema

```yaml
apiVersion: krate.a5c.ai/v1alpha1
kind: ExternalProviderCapabilityManifest
metadata:
  name: github-v1
spec:
  providerType: github
  displayName: GitHub
  hosting:
    - saas
    - github-enterprise-server
  authModes:
    - github-app
    - oauth-user
  api:
    rest: true
    graphql: true
    webhook: true
  identity:
    nativeIdFields: [id, number]
    globalIdField: node_id
    urlField: html_url
    versionFields: [etag, updated_at, head_sha]
  interfaces: {}
```

## Operation shape

```yaml
operation: createPullRequest
supported: true
write: true
requires:
  permissions:
    - gitForge.pullRequests.write
  authModes:
    - github-app
    - oauth-user
  nativeScopes:
    - pull_requests:write
idempotency:
  mode: synthetic-key
rateLimitCost:
  restRequests: 1
webhookConfirmation:
  events: [pull_request]
```

## GitHub manifest sketch

```yaml
providerType: github
interfaces:
  issueTracking:
    supported: true
    objects: [Issue, IssueComment, Label, Milestone]
    operations:
      - listIssues
      - getIssue
      - createIssue
      - updateIssue
      - closeIssue
      - listComments
      - createComment
      - updateComment
      - listLabels
      - syncLabels
    webhooks: [issues, issue_comment, label, milestone]
  cicd:
    supported: true
    objects: [WorkflowRun, WorkflowJob, CheckRun, CheckSuite, CommitStatus, Runner]
    operations:
      - listWorkflowRuns
      - getWorkflowRun
      - listWorkflowJobs
      - rerunWorkflowRun
      - cancelWorkflowRun
      - listSelfHostedRunners
      - createCheckRun
      - updateCheckRun
    webhooks: [workflow_run, workflow_job, check_run, check_suite, status]
  gitForge:
    supported: true
    objects: [Repository, PullRequest, Review, Ref, Commit, DeployKey, BranchProtection, Collaborator]
    operations:
      - listRepositories
      - getRepository
      - createRepository
      - updateRepository
      - listPullRequests
      - createPullRequest
      - updatePullRequest
      - mergePullRequest
      - listRefs
      - getCommit
      - syncDeployKeys
      - syncBranchProtection
    webhooks: [repository, pull_request, pull_request_review, pull_request_review_comment, push, create, delete, deploy_key, branch_protection_rule]
```

## GitLab manifest sketch

```yaml
providerType: gitlab
hosting: [saas, self-managed]
authModes: [oauth-user, project-token, group-token, personal-access-token]
interfaces:
  issueTracking:
    supported: true
    objects: [Issue, Note, Label, Milestone]
    webhooks: [Issues Hook, Note Hook]
  cicd:
    supported: true
    objects: [Pipeline, Job, Artifact, Runner]
    webhooks: [Pipeline Hook, Job Hook]
  gitForge:
    supported: true
    objects: [Project, MergeRequest, Approval, Branch, Tag, DeployKey, ProtectedBranch]
    webhooks: [Push Hook, Tag Push Hook, Merge Request Hook]
```

## Jira manifest sketch

```yaml
providerType: jira
hosting: [cloud, data-center]
interfaces:
  issueTracking:
    supported: true
    objects: [Issue, Comment, Project, Component, Version, Sprint, Board]
    operations: [listIssues, getIssue, createIssue, updateIssue, transitionIssue, createComment, updateComment]
    webhooks: [issue_created, issue_updated, issue_deleted, comment_created, comment_updated]
  cicd:
    supported: false
  gitForge:
    supported: false
notes:
  bodyFormat: atlassian-document-format
```

## Buildkite manifest sketch

```yaml
providerType: buildkite
interfaces:
  issueTracking:
    supported: false
  cicd:
    supported: true
    objects: [Pipeline, Build, Job, Agent, Artifact]
    operations: [listPipelines, listBuilds, getBuild, listJobs, getLog, rebuildBuild, cancelBuild, listAgents]
    webhooks: [build.scheduled, build.running, build.finished, job.finished]
  gitForge:
    supported: false
```

## Custom provider manifest

Custom providers must declare exact operations and webhook normalization rules:

```yaml
providerType: custom
adapterRef:
  package: '@a5c-ai/krate-provider-acme'
  version: 1.x
interfaces:
  issueTracking:
    supported: true
    operations: [listIssues, getIssue]
  cicd:
    supported: false
  gitForge:
    supported: false
```

## UI use

The UI uses manifests to:

- show only supported interface checkboxes;
- explain unsupported actions;
- choose auth forms;
- show webhook event requirements;
- render provider-specific object labels;
- warn when selected sync mode requires unsupported write operations;
- drive setup wizard validation.

## Test use

Contract tests use manifests to:

- generate provider capability tests;
- assert unsupported operations are disabled;
- run shared interface suites only for supported interfaces;
- validate provider fixture completeness;
- verify webhook event normalization coverage.
