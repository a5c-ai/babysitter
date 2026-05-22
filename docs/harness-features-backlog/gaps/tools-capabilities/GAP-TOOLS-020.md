# GAP-TOOLS-020: Scheduled Orchestration Triggers

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Enable cron-like scheduled triggers that automatically create and execute orchestration runs on a recurring schedule. Extends the orchestrator beyond interactive/on-demand execution into scheduled automation -- CI/CD-style recurring processes, periodic health checks, and automated maintenance workflows.

## Current State
All orchestration runs are explicitly triggered via `babysitter-agent create-run` or `babysitter-agent call`. No scheduling mechanism exists. The `babysitter-agent forever` command runs an infinite loop process but requires an active session. GAP-REMOTE-004 covers cron triggers at the remote integration level but not the local scheduling surface.

## Target State
A scheduling subsystem that: defines recurring triggers with cron expressions, creates runs from process definitions on schedule, manages trigger lifecycle (enable/disable/pause), logs trigger history and outcomes, integrates with the embedded SDK dashboard for monitoring. Works locally via a daemon process and remotely via GAP-REMOTE-004 infrastructure.

## Dependencies
- [GAP-REMOTE-001](../remote-integration/GAP-REMOTE-001.md) -- daemon mode for background scheduling
- [GAP-REMOTE-004](../remote-integration/GAP-REMOTE-004.md) -- cron triggers at the remote level

## Key Files
| Component | Path |
|-----------|------|
| CLI entry | `packages/sdk/src/cli/main.ts` |
| Run creation | `packages/sdk/src/runtime/` |
| Config | `packages/sdk/src/config/` |

## Recommendation
Phase 4 implementation. Build on GAP-REMOTE-001 daemon mode. Add a `trigger:create` / `trigger:list` / `trigger:delete` CLI surface. Store trigger definitions in `~/.a5c/triggers/`. Integrate with embedded SDK dashboard for visibility.
