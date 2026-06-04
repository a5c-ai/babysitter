# GAP-MCPC-003: Channel Permission Relay (Breakpoint Approval via Channels)

| Field | Value |
|-------|-------|
| Category | mcp-channels |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Route breakpoint approval prompts through messaging channels and accept
approvals from channel responses. An operator on Slack can see a breakpoint
notification and approve/reject without being at the terminal.

## CC Implementation

CC's channel permission relay (`src/services/mcp/channelPermissions.ts`):
- When a permission dialog appears, CC sends the prompt via active channels
- Races channel reply against local UI / bridge / hooks / classifier
- First resolver wins via `claim()` pattern
- Inbound approval: `notifications/claude/channel/permission` with
  `{request_id, behavior}`
- Channel server must declare `capabilities.experimental['claude/channel/permission']`
- Security model: the approving party is the human via the channel, not Claude
- Risk assessment: a compromised channel server CAN fabricate approvals
  (documented and accepted risk -- see PR discussion in CC source)
- Feature-gated separately from channels: `tengu_harbor_permissions`

## Current State
Breakpoints are approved only via:
1. CLI interaction (readline prompt)
2. Auto-approval rules (`~/.a5c/breakpoint-approvals/rules.json`)
3. Programmatic `task:post` from the harness operator

No external channel routing. Operator must be at the terminal or running the
harness to approve breakpoints.

## Target State
Breakpoint prompts routed to configured channels. Channel responses race against
local interaction. First approval wins. Security: channel-based approval requires
explicit opt-in per breakpoint tag/expert level. High-risk breakpoints can be
configured to require terminal-only approval.

```
[Slack #orchestration]
babysitter-bot: Breakpoint in run 01KNKDVE...
  "Review gap audit results -- 52 removed, 25 reframed. Approve?"
  React: thumbsup to approve, thumbsdown to reject

[operator reacts thumbsup]

babysitter: Breakpoint approved via Slack by @tal (12s response time)
```

## Dependencies
- [GAP-MCPC-001](GAP-MCPC-001.md) -- MCP channel connection
- [GAP-BRK-002](../breakpoint-workflows/GAP-BRK-002.md) -- breakpoint delegation to external systems

## Key Files
| Component | Path |
|-----------|------|
| Breakpoint evaluator | `packages/sdk/src/breakpoints/evaluator.ts` |
| Interaction module | `packages/sdk/src/interaction/` |
| CC channel permissions | `src/services/mcp/channelPermissions.ts` |

## Recommendation
Phase 3. High value for teams -- enables async approval workflows. Implement
after MCP channel connection (GAP-MCPC-001) and breakpoint delegation (GAP-BRK-002).
The claim() racing pattern from CC is elegant and should be adopted.
