# GAP-TOOLS-034: Dynamic Tool Discovery and Search

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Discover and search available tools at runtime, including deferred tools from
MCP servers. CC's `ToolSearchTool` enables lazy loading of tool schemas -- tools
are listed by name but their full schemas are only fetched when needed.

## Current State
Babysitter's agentic tools are a fixed set of 16 tools loaded upfront into Pi
sessions. All tool schemas are included in the initial prompt. No deferred loading.
No tool discovery from MCP servers. No search across available tools.

When MCP client capability is added (GAP-TOOLS-025), the number of available tools
could grow to 50+ (MCP servers like Slack expose 10+ tools each). Loading all
schemas upfront would bloat the prompt.

## Target State
- Deferred tool loading: tools listed by name only, full schema fetched on demand
- `tool_search` agentic tool: search tools by keyword or capability
- MCP tool discovery: list tools from connected MCP servers
- Tool categorization: group tools by source (agentic, MCP:slack, MCP:gmail, etc.)
- Prompt optimization: only include schemas for tools likely needed by the task

## Dependencies
- [GAP-TOOLS-025](GAP-TOOLS-025.md) -- MCP client (source of dynamic tools)
- [GAP-PROMPT-002](../prompt-engineering/GAP-PROMPT-002.md) -- capability projection (which tools to include)

## Key Files
| Component | Path |
|-----------|------|
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| Prompts module | `packages/sdk/src/prompts/` |

## Recommendation
Phase 3 (M4). Implement when MCP client adds many tools. The deferred loading
pattern is essential for prompt size management. CC's ToolSearchTool pattern
(name-only listing + on-demand schema fetch) is the right approach.
