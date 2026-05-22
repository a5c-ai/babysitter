# User-facing changes

## Purpose

External backend support should feel native in Krate while making ownership and sync status obvious. Users should know when data is mirrored from GitHub, when Krate can write back, and when a conflict requires attention.

## Global UI changes

- Add `External Integrations` under org settings.
- Add provider badges to synced repositories, issues, PRs, runs, and settings.
- Add native provider links on detail pages.
- Add sync health cards on org dashboard.
- Add conflict and rate-limit attention items to Inbox/Insights.

## Provider setup wizard

Steps:

1. choose provider type, starting with GitHub;
2. choose interfaces: issue tracking, CI/CD, git forge;
3. configure auth: GitHub App app ID, private key Secret, webhook Secret, installation ID;
4. choose repositories or org-wide scope;
5. choose sync modes per interface;
6. run permission/capability check;
7. create `ExternalBackendProvider`, binding, and sync policy resources.

## Repository settings

External backend section shows:

- provider and native URL;
- enabled interfaces and ownership modes;
- last webhook delivery and last backfill;
- conflicts and rate-limit warnings;
- managed vs mirrored settings;
- sync now, pause sync, replay webhook, disconnect actions.

## Issue/PR/run pages

- Native GitHub links are visible but secondary.
- Sync state indicates current, stale, conflict, or degraded.
- Mutating controls show whether the action is local, write-through, or reviewed-write.
- Agent-generated external writes require explicit approval unless policy allows them.

## Runs and CI

- GitHub Actions workflow runs appear beside Krate-native pipelines.
- External jobs show provider, native URL, status, logs/artifacts availability, rerun/cancel capability.
- External runners are labeled provider-managed, Krate-managed, or mirrored.

## Conflict UI

Conflicts show:

- field name;
- Krate value;
- external value;
- last synced time;
- ownership mode;
- resolution actions: keep external, apply Krate, manual edit, ignore unsupported.

## Acceptance criteria

- Users can configure GitHub without editing YAML, but YAML remains available.
- Users can tell which system owns each field/action.
- External sync failures are visible and actionable.
- Provider write actions are audited and permission-checked.
