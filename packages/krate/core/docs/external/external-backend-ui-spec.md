# External backend UI specification

## Purpose

This document defines the full UI for external backend integrations: provider setup, bindings, sync health, conflicts, write intents, webhooks, and per-resource provider status.

## Navigation

Add org-scoped routes:

| Route | Purpose |
| --- | --- |
| `/orgs/[org]/settings/external-backends` | provider list, add provider, health summary. |
| `/orgs/[org]/settings/external-backends/[provider]` | provider detail, auth, capabilities, rate limits. |
| `/orgs/[org]/settings/external-backends/[provider]/bindings` | repository/project bindings and interface modes. |
| `/orgs/[org]/settings/external-backends/[provider]/webhooks` | webhook delivery log, replay, redelivery, failures. |
| `/orgs/[org]/settings/external-backends/[provider]/sync` | sync state, backfill, cursors, queues. |
| `/orgs/[org]/settings/external-backends/[provider]/conflicts` | conflicts and resolution. |
| `/orgs/[org]/settings/external-backends/[provider]/writes` | write intents, approvals, retries. |

Repository pages show external backend panels under Settings, Issues, Pull Requests, Runs, Hooks, and Code where relevant.

## Provider list page

Cards show:

- provider name/type;
- enabled interfaces;
- auth health;
- webhook health;
- rate-limit/degraded state;
- last backfill;
- conflicts count;
- write intents needing attention;
- repositories bound.

Primary actions:

- add provider;
- resync all;
- pause/resume provider;
- open YAML.

## Add provider wizard

Steps:

1. Select provider type: GitHub, GitLab, Bitbucket, Azure DevOps, Jira, Linear, Buildkite, CircleCI, Jenkins, Gitea, Custom.
2. Select hosting: SaaS or self-managed and base URLs.
3. Select interfaces to enable.
4. Configure auth and Secret refs.
5. Validate credentials and capabilities.
6. Select org/repository/project bindings.
7. Choose sync ownership modes.
8. Configure webhook endpoint and secret.
9. Review generated YAML.
10. Apply and start initial backfill.

## Binding UI

Binding rows show:

- Krate target resource;
- external owner/project/repo key;
- enabled interfaces;
- mode per interface;
- last sync state;
- native provider URL;
- conflict count;
- actions: sync now, edit modes, disconnect, view YAML.

## Resource badges

Synced resources display:

- provider icon/name;
- native URL;
- sync phase: current, stale, paused, conflict, degraded, write pending;
- ownership: mirrored, external-owned, Krate-owned, bidirectional;
- last synced time;
- pending write/conflict indicator.

## Conflict resolution UI

Conflict detail shows:

- resource and native URL;
- field conflicts;
- local value;
- external value;
- last local generation;
- provider version/etag;
- policy recommendation;
- actions: keep external, apply Krate, manual edit, ignore unsupported, retry sync.

## Write intent UI

Write intent detail shows:

- actor and source action;
- target provider/interface;
- native operation;
- request preview with secrets redacted;
- approval state;
- retry count;
- provider response summary;
- linked audit events;
- actions: approve, reject, retry, cancel, open native object.

## Webhook and sync UI

Webhook page shows:

- delivery ID;
- event/action;
- repository/project;
- received time;
- signature status;
- processing phase;
- response code;
- normalized event ID;
- replay action.

Sync page shows:

- high-watermarks/cursors by interface/resource kind;
- current queue depth;
- rate-limit budget;
- backfill schedule;
- last full resync;
- paused/degraded reasons.

## Repository settings integration

`/orgs/[org]/repositories/[repo]/settings` gains an External Backends section:

- current provider binding;
- interface modes;
- sync health;
- branch protection ownership;
- issue/PR/CI ownership;
- webhook delivery status;
- quick link to provider settings.

## Acceptance criteria

- Users can configure a provider without writing YAML.
- YAML remains visible for every provider resource.
- UI never enables unsupported provider operations.
- Conflicts and write intents are first-class and actionable.
- Every synced resource shows provider ownership and native link.
