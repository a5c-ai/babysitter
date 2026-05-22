# GAP-UX-001c: Permission and Breakpoint Approval UI

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Rich terminal UI for breakpoint approvals with context display, risk assessment,
option selection, and history. Replace the current readline-based interaction
with an Ink-rendered approval dialog.

## CC Reference
CC has 29 files in `src/components/permissions/`:
- `PermissionDialog.tsx` -- base dialog with approve/deny/always-approve
- `PermissionPrompt.tsx` -- prompt with explanation
- `PermissionRequest.tsx` -- request container
- `PermissionExplanation.tsx` -- why this permission is needed
- `PermissionRuleExplanation.tsx` -- which rule matched
- `PermissionDecisionDebugInfo.tsx` -- debug info for decisions
- Per-tool permission UIs: `BashPermissionRequest/`, `FileEditPermissionRequest/`,
  `FileWritePermissionRequest/`, `WebFetchPermissionRequest/`, etc.
- Worker-specific: `WorkerBadge.tsx`, `WorkerPendingPermission.tsx`

## Current State
Breakpoint interaction uses `packages/sdk/src/interaction/` which is raw
readline with arrow-key selectors. No context display beyond the question text.
No risk visualization. No auto-approval rule explanation. The auto-approval
system (`packages/sdk/src/breakpoints/`) computes recommendations but they are
not surfaced in the UI.

## Target State
An Ink-based `BreakpointApproval` component that renders:
```
┌─ Breakpoint: Review gap audit results ──────────────────────┐
│                                                               │
│ 52 removed, 25 reframed, 16 merged, 40 kept.                │
│ Review and approve?                                           │
│                                                               │
│ Context:                                                      │
│   Removed: GAP-TOOLS-001 (File Read Tool) -- host harness    │
│            GAP-UX-002 (Voice Mode) -- host harness            │
│            ... 50 more                                        │
│                                                               │
│ Auto-approval: Not recommended (no matching rule)             │
│ Consecutive approvals: 0                                      │
│                                                               │
│ > [Approve]  [Request changes]  [Always approve this type]   │
└───────────────────────────────────────────────────────────────┘
```

Shows: breakpoint context, auto-approval recommendation with reason,
matched rule (if any), consecutive approval count, risk indicators,
selectable options with keyboard navigation.

## Dependencies
- [GAP-UX-001](GAP-UX-001.md) -- Ink rendering foundation
- [GAP-BRK-001](../breakpoint-workflows/GAP-BRK-001.md) -- approval chains

## Key Files
| Component | Path |
|-----------|------|
| Interaction module | `packages/sdk/src/interaction/` |
| Breakpoints module | `packages/sdk/src/breakpoints/` |
| CC reference | `src/components/permissions/` |

## Recommendation
Phase 2. Replace interaction module's readline with Ink renderer. Start with
breakpoint approval since it's the highest-frequency user interaction in
orchestration. Surface auto-approval data from task.json in the dialog.
