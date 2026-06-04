# GAP-TOOLS-021: External Event Triggers for Orchestration

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Enable external events (webhooks, file system changes, git push events, CI/CD pipeline completions) to trigger orchestration runs. The orchestrator should be able to react to external stimuli, not just user-initiated commands -- enabling event-driven automation workflows.

## Current State
Runs are user-initiated only. The hook system (`packages/sdk/src/hooks/`) fires hooks during run lifecycle but does not receive external events. No webhook endpoint, filesystem watcher, or event listener exists. The MCP server could theoretically receive external calls but has no event-to-run mapping.

## Target State
An event ingestion layer that: receives webhooks via HTTP endpoint (when daemon mode is active), watches filesystem paths for changes, listens for git events (post-push, post-merge), maps events to process definitions via configurable rules, creates runs with event payload as inputs. Integrates with the embedded SDK dashboard for event visibility.

## Dependencies
- [GAP-REMOTE-001](../remote-integration/GAP-REMOTE-001.md) -- daemon mode for persistent event listening
- [GAP-TOOLS-020](../tools-capabilities/GAP-TOOLS-020.md) -- scheduling as a special case of triggers
- [GAP-OBS-NEW-001](../observer-integration/GAP-OBS-NEW-001.md) -- webhooks for outbound event notifications

## Key Files
| Component | Path |
|-----------|------|
| Hooks | `packages/sdk/src/hooks/` |
| MCP server | `packages/sdk/src/mcp/` |
| Run creation | `packages/sdk/src/runtime/` |

## Recommendation
Phase 4 implementation. Start with filesystem watchers and git hooks as trigger sources. Add webhook ingestion when daemon mode is available. Define event-to-process mapping configuration format.
