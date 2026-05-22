# Research results

## Purpose

This document records the GitHub research used to design Krate external backend integration. It intentionally focuses on official GitHub surfaces and the implications for Krate's provider abstractions.

## GitHub integration surfaces

| Surface | Relevant GitHub capability | Krate implication |
| --- | --- | --- |
| GitHub Apps | authenticate as app, installation, or user; installation tokens; permission-scoped access | use GitHub App installation as default automation identity; use user tokens only for actor-attributed actions. |
| REST API | repositories, issues, pull requests, Actions, checks, webhooks, deploy keys, refs, commits | implement provider connectors with endpoint-specific permissions and rate-limit handling. |
| GraphQL API | precise data selection, node IDs, connections/cursors | use for efficient list/detail sync, cross-object hydration, and stable global IDs. |
| Webhooks | repository/org/app events with payloads and delivery IDs | use webhook-first sync for freshness and as trigger source. |
| Webhook delivery APIs | recent delivery inspection and redelivery | support replay/recovery and delivery audit. |
| Actions APIs | workflows, workflow runs, jobs, logs, self-hosted runners | map GitHub Actions into Krate pipeline/job/runner abstractions. |
| Checks/status APIs | checks, statuses, workflow check suites/runs | map external checks into Krate CI status and PR gates. |
| Deploy keys and Git access | repository-scoped SSH deploy keys and installation-token HTTP Git access | support external Git checkout/mirroring without PATs. |

## Key findings

- GitHub's REST API covers repository management, issue management, pull requests/reviews, workflow runs, self-hosted runners, checks, deploy keys, refs, commits, and repository webhooks.
- GitHub webhooks should be subscribed narrowly; GitHub documents using secrets, HTTPS, event/action filtering, unique delivery IDs, fast 2XX responses, queues for asynchronous processing, and redelivery for recovery.
- GitHub App installation tokens expire and are permission-bound; user access tokens can attribute user actions but are limited by both app permissions and user permissions.
- GitHub GraphQL exposes precise object selection, node IDs, connections, and cursors; REST payloads often include `node_id`, which can bridge REST and GraphQL identities.
- GitHub Actions workflow runs can be viewed, rerun, canceled, and logged through REST; self-hosted runners can be listed, registered, and deleted through Actions APIs.
- GitHub pull requests are issue-like for labels, assignees, milestones, and comments, so issue and pull-request sync must coordinate shared issue-number identity.
- GitHub deploy keys are repository-scoped SSH keys and are separate from GitHub App installation-token HTTP Git access.

## Sources

- GitHub REST API overview and repository endpoints.
- GitHub Issues REST endpoints.
- GitHub Pull Requests REST endpoints.
- GitHub Actions workflow run, workflow, checks, and self-hosted runner endpoints.
- GitHub Webhooks docs: events/payloads, best practices, validation, deliveries, redelivery.
- GitHub Apps auth docs: app JWT, installation tokens, user tokens, permissions.
- GitHub GraphQL docs: node IDs, precise queries, cursor pagination, schema.

## Design impact

Krate should not create a GitHub-only data model. Instead, GitHub is the first provider implementation of three interfaces:

1. issue tracking provider;
2. CI/CD provider;
3. git forge provider.

GitHub can support all three. Other providers may only support one or two. For example, Jira may support issue tracking only; Buildkite may support CI/CD only; a raw Git server may support git forge only.
