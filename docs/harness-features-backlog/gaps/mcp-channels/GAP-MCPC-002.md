# GAP-MCPC-002: MCP Channel Outbound Messaging

| Field | Value |
|-------|-------|
| Category | mcp-channels |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Send messages from orchestration runs to external channels (Slack, Discord, email)
via MCP server tools. Enable processes to notify operators, report progress, and
share results through messaging platforms.

## CC Implementation
CC's outbound messaging works through MCP tools exposed by channel servers:
- Slack MCP server exposes `slack_send_message`, `slack_send_message_draft`,
  `slack_schedule_message`
- Gmail MCP server exposes `gmail_create_draft`
- Calendar MCP server exposes `gcal_create_event`
- The model decides which channel's tool to use based on context
- Channel tools are regular MCP tools -- no special plumbing needed once MCP
  client is connected

## Current State
No MCP client capability. Cannot invoke external MCP server tools.
Processes cannot send messages to external systems.

## Target State
Processes can invoke channel MCP tools as effects:
```javascript
await ctx.task(defineTask('notify-slack', () => ({
  kind: 'mcp-tool',
  mcpServer: 'slack',
  tool: 'slack_send_message',
  args: { channel: '#orchestration', text: 'Run completed: 128 gaps generated' }
})));
```

## Dependencies
- [GAP-MCPC-001](GAP-MCPC-001.md) -- MCP channel connection
- [GAP-TOOLS-025](../tools-capabilities/GAP-TOOLS-025.md) -- MCP client capability

## Key Files
| Component | Path |
|-----------|------|
| CC MCP tools | Available as deferred tools via `mcp__claude_ai_Slack__*` |

## Recommendation
Phase 3. Once MCP client is working (GAP-TOOLS-025), channel outbound is
essentially free -- just invoke the channel server's tools.
