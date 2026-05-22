# GAP-REMOTE-004: Cron Triggers and Scheduling

| Field | Value |
|-------|-------|
| Category | remote-integration |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Persistent cron-based triggers for automated run creation on a schedule, enabling recurring orchestration tasks like nightly code review, periodic health checks, or scheduled deployments.

## Current State
No scheduling. harness:forever is manual infinite loop. No cron expressions, no persistent triggers.

## Target State
Cron scheduling with persistent triggers surviving process restart. Standard cron expressions (minute, hour, day, month, weekday). trigger:list shows next scheduled execution time.

## Dependencies
- None

## Key Files
| Component | Path |
|-----------|------|
| CLI commands | `packages/sdk/src/cli/` |
| Config module | `packages/sdk/src/config/` |

## Recommendation
Phase 4 implementation. Create scheduling module with cron parser. Store triggers in ~/.a5c/triggers.json. Implement trigger daemon.
