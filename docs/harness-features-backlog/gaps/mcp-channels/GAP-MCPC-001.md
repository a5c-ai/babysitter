# GAP-MCPC-001: MCP Channel Integration (Inbound Messaging)

| Field | Value |
|-------|-------|
| Category | mcp-channels |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Support MCP servers as messaging channels (Slack, Discord, Telegram, iMessage,
email) that can push inbound messages into orchestration runs. A "channel" is
an MCP server that sends `notifications/claude/channel` notifications for
inbound messages and exposes tools for outbound messages.

## CC Implementation

CC's channel system (`src/services/mcp/channelNotification.ts`):
- MCP servers declare channel capability in `capabilities.experimental['claude/channel']`
- Inbound messages arrive as `notifications/claude/channel` notifications
- Messages wrapped in `<channel source="..." sender="...">content</channel>` XML tags
- SleepTool polls `hasCommandsInQueue()` and wakes within 1s to process inbound
- The model sees the source channel and decides which tool to reply with
- Channel allowlist (`channelAllowlist.ts`) controls which channels are active
- Channel entries have: `serverName`, `displayName`, `channelId`, `channelType`
- Requires explicit opt-in (not default-enabled)
- Feature-gated: `tengu_harbor` / `KAIROS_CHANNELS`

## Current State
Babysitter has `mcp:serve` which exposes babysitter as an MCP SERVER. But there
is no MCP CLIENT capability for connecting to external MCP servers as channels.
No channel notification handling. No inbound message queue. No channel allowlist.

## Target State
Babysitter can connect to MCP servers that act as messaging channels. Inbound
messages from channels are:
1. Queued as journal events (`CHANNEL_MESSAGE` type)
2. Routed to active runs based on channel binding
3. Available as context during breakpoint decisions
4. Trigger run wake-up if sleeping

This enables operators to receive breakpoint notifications on Slack and
approve/reject from their phone.

## Dependencies
- [GAP-TOOLS-025](../tools-capabilities/GAP-TOOLS-025.md) -- MCP client capability

Note: MCPC-002 and MCPC-003 depend on MCPC-001, not the other way around.

## Key Files
| Component | Path |
|-----------|------|
| Babysitter MCP server | `packages/sdk/src/mcp/` |
| CC channel notifications | `src/services/mcp/channelNotification.ts` |
| CC channel allowlist | `src/services/mcp/channelAllowlist.ts` |
| CC MCP connection mgr | `src/services/mcp/MCPConnectionManager.tsx` |

## Recommendation
Phase 2-3. Requires MCP client capability first (GAP-TOOLS-025). Then implement
channel notification handler and message queue. Start with Slack as the first
channel (already has an MCP server in the CC ecosystem).
