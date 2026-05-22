# GAP-REMOTE-001: Daemon Mode

| Field | Value |
|-------|-------|
| Category | remote-integration |
| Priority | High |
| Effort | XL |
| Status | Partial |

## Description
Persistent background orchestration service that monitors triggers (file changes, webhooks, timers) and spawns runs automatically, replacing the manual harness:forever approach.

## Current State
harness:forever provides infinite loop but requires an active terminal session. No file change monitoring, no trigger-based activation, no background service lifecycle.

## Target State
System service with start/stop/status lifecycle. File change watcher integration. Trigger-based activation (file changes, webhooks, timers). Journal-backed state persistence across activations.

## Dependencies
- [GAP-REMOTE-004](../remote-integration/GAP-REMOTE-004.md) -- cron triggers for timer-based activation

## Key Files
| Component | Path |
|-----------|------|
| CLI commands | `packages/sdk/src/cli/` |
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |

## Recommendation
Phase 3 implementation. Create daemon module with service manager, file watcher, and trigger activation. Add daemon:start/stop/status CLI commands.
