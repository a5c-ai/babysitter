# GAP-UX-001f: Streaming Output Panels

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Real-time streaming panels that display output from delegated harness
invocations as they execute. Split-pane or scrolling view showing what each
dispatched subagent is doing, with live stdout/stderr capture.

## CC Reference
CC has:
- `src/components/MessageResponse.tsx` -- streams assistant responses token by token
- `src/components/VirtualMessageList.tsx` -- virtualized scrolling for long output
- `src/components/ToolUseLoader.tsx` -- loading indicator while tool executes
- `src/components/messages/UserBashOutputMessage.tsx` -- formatted bash output
- `src/components/messages/HookProgressMessage.tsx` -- hook execution streaming
- `src/components/CompactSummary.tsx` -- compact view of large outputs

## Current State
`invokeHarness()` in `packages/sdk/src/harness/invoker.ts` captures stdout/stderr
only after the child process exits. No streaming during execution. No embedded SDK dashboard exists yet to show what a delegated harness is doing in real-time. Task
results are visible only after completion.

## Target State
An Ink `StreamingPanel` component that:
- Attaches to child process stdout/stderr pipes from invokeHarness()
- Renders output in a scrollable, bounded panel
- Supports multiple panels for parallel effects (split view)
- Truncates/virtualizes long output to stay within terminal bounds
- Shows elapsed time and byte count
- Color-codes stderr vs stdout

```
┌─ S000005 generate-gap-files [running 45s] ─────────────────┐
│ Creating gaps/prompt-engineering/GAP-PROMPT-001.md          │
│ Creating gaps/prompt-engineering/GAP-PROMPT-002.md          │
│ Creating gaps/tools-capabilities/GAP-TOOLS-008.md           │
│ ...                                                         │
│ [streaming 2.3KB]                                          │
└─────────────────────────────────────────────────────────────┘
```

## Dependencies
- [GAP-UX-001](GAP-UX-001.md) -- Ink rendering foundation
- [GAP-SUBOBS-001](../subagent-observability/GAP-SUBOBS-001.md) -- streaming capture from harnesses

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Pi wrapper | `packages/sdk/src/harness/piWrapper.ts` (has subscribe()) |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| CC reference | `src/components/MessageResponse.tsx` |
| CC reference | `src/components/VirtualMessageList.tsx` |

## Recommendation
Phase 2-3. Requires changes to invokeHarness() to pipe stdout/stderr in real-time
instead of buffering. Pi already has subscribe() for streaming events. The Ink
panel needs virtualization for long output. Start with single-panel view, then
add split-pane for parallel effects.
