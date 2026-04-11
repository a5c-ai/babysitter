# GAP-UX-001d: Message Type Rendering

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Type-specific rendering for different journal event types and task results.
Each event type (EFFECT_REQUESTED, EFFECT_RESOLVED, RUN_COMPLETED, RUN_FAILED)
and task kind (agent, shell, breakpoint, sleep) gets a specialized renderer
with appropriate formatting, color coding, and detail level.

## CC Reference
CC has 35 message type renderers in `src/components/messages/`:
- `AssistantTextMessage.tsx` -- AI text responses
- `AssistantToolUseMessage.tsx` -- tool call display
- `AssistantThinkingMessage.tsx` -- thinking block display
- `UserBashOutputMessage.tsx` -- bash output formatting
- `HookProgressMessage.tsx` -- hook execution progress
- `PlanApprovalMessage.tsx` -- plan mode approval
- `RateLimitMessage.tsx` -- rate limit handling
- `SystemAPIErrorMessage.tsx` -- API error display
- `TaskAssignmentMessage.tsx` -- task delegation display
- `CompactBoundaryMessage.tsx` -- compaction boundary marker

Plus `Message.tsx` as the dispatcher that selects the right renderer per message type.

## Current State
`run:events` outputs raw JSON events. No embedded SDK dashboard exists yet. No type-specific rendering. No color coding by event type. Task results
displayed as raw JSON regardless of kind.

## Target State
A message dispatcher component that renders each event type appropriately:
- `EFFECT_REQUESTED`: Shows task title, kind icon, labels, step ID
- `EFFECT_RESOLVED`: Shows duration, status (ok/error), result summary
- `RUN_COMPLETED`: Shows completion proof, total duration, effect count
- `RUN_FAILED`: Shows error message, stack trace, last good state
- Agent task result: Shows summary of work done
- Shell task result: Shows command, exit code, stdout/stderr with truncation
- Breakpoint result: Shows who approved, response text, timing

## Dependencies
- [GAP-UX-001](GAP-UX-001.md) -- Ink rendering foundation

## Key Files
| Component | Path |
|-----------|------|
| Run events CLI | `packages/sdk/src/cli/` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| Storage types | `packages/sdk/src/storage/types.ts` (event types) |
| CC reference | `src/components/messages/` |
| CC message dispatcher | `src/components/Message.tsx` |

## Recommendation
Phase 3. Build a `JournalEventRenderer` that dispatches to per-type components.
Start with the 4 core event types. Extend to task-kind-specific result rendering.
Integrate into embedded SDK dashboard first, then `run:events --rich` CLI flag.
