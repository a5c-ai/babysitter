# Issue tracking interface

## Purpose

The issue tracking interface syncs externally managed work items into Krate and optionally writes changes back. It covers issues, comments, labels, milestones, assignees, projects, saved views, reactions, and issue events.

## Provider contract

A provider implementing this interface should support some or all of:

```ts
interface IssueTrackingProvider {
  listIssues(cursor): Page<ExternalIssue>;
  getIssue(ref): ExternalIssue;
  createIssue(input): ExternalIssue;
  updateIssue(ref, patch): ExternalIssue;
  closeIssue(ref, reason): ExternalIssue;
  listComments(issueRef, cursor): Page<ExternalComment>;
  createComment(issueRef, input): ExternalComment;
  updateComment(commentRef, patch): ExternalComment;
  listLabels(cursor): Page<ExternalLabel>;
  syncLabels(desired): SyncResult;
  listEvents(issueRef, cursor): Page<ExternalIssueEvent>;
}
```

Capabilities are negotiated; read-only providers can omit mutating operations.

## Resource mapping

| External concept | Krate resource/projection |
| --- | --- |
| issue/work item | `Issue` |
| issue comment | `IssueComment` aggregated projection or `Issue.status.comments` summary |
| label | `IssueLabel` config/projection or labels on `Issue` |
| milestone | `Milestone` projection or metadata field |
| assignee | `User`/`Team` references plus external identity mapping |
| project field | `View`, `Selector`, or provider-specific field projection |
| linked PR | `PullRequest` edge |
| issue event | `ExternalSyncEvent` or issue activity stream |

## GitHub mapping

GitHub Issues map naturally to Krate `Issue`. GitHub pull requests also have issue numbers and issue-like comments/labels, so the GitHub issue provider must avoid duplicating PR-backed issues. A GitHub issue with `pull_request` metadata should link to the `PullRequest` projection rather than become an independent work item unless the UI explicitly needs a combined activity view.

## Sync rules

- Webhooks handle `issues`, `issue_comment`, `label`, `milestone`, and assignment events.
- Backfill/poll handles missed events and periodic consistency checks.
- Cursor sync stores provider cursor or `updated_at` high-water mark.
- Writes include idempotency keys where provider supports them; otherwise Krate stores write intent and native result.
- Conflicts create `ExternalSyncConflict` when local desired state and external state both changed since last sync.

## User-facing changes

- Issue pages show external provider badges, native URLs, sync status, and conflict state.
- Editing an externally owned issue shows whether the change writes through, opens a reviewed change, or is disabled.
- Comments show source: Krate, GitHub, imported, or agent.
- Label management shows external ownership and drift.

## Acceptance criteria

- A read-only issue provider can mirror issues and comments without write permissions.
- A bidirectional provider can update title/body/state/labels/comments and detect conflicts.
- GitHub PR-backed issues link to PRs instead of duplicating work items.
- Webhook replay and cursor backfill converge to the same state.
