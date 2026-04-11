# GAP-TOOLS-008: Web Search Agentic Tool

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Add a `web_search` agentic tool to babysitter's Pi session tool set, equivalent to
CC's WebSearchTool. Enables orchestrated tasks to perform web searches directly
without relying on the delegated harness having its own search capability.

## Current State
No `web_search` tool in `agenticTools.ts`. Process definitions that need web search
must delegate to a harness that has its own search tool (CC has WebSearchTool, Pi
does not). The `fetch` tool can retrieve known URLs but cannot discover URLs via
search.

## Target State
A `web_search` agentic tool with these params (matching CC's WebSearchTool):

- **`query`** (string, required): Search query, minimum 2 characters
- **`allowed_domains`** (string[], optional): Whitelist of domains to search
- **`blocked_domains`** (string[], optional): Blacklist of domains to exclude

Returns search results with titles, URLs, and snippets.

Implementation options:
1. **API-based**: Use a search API (SerpAPI, Brave Search, Tavily, etc.) with an
   API key configured via env var (`BABYSITTER_SEARCH_API_KEY`).
2. **MCP-routed**: If an MCP server with search capability is connected, route
   through it. Falls back to API-based if no MCP search available.
3. **Harness-delegated**: Route search requests to a capable harness (CC, etc.)
   as a task effect. Least direct but requires no API keys.

Also add `webSearch` to `HarnessCapability` enum for capability-based routing
when the tool is not available locally.

## Dependencies
- [GAP-TOOLS-025](GAP-TOOLS-025.md) -- MCP client (for MCP-routed search)
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability routing (for harness-delegated fallback)

## Key Files
| Component | Path |
|-----------|------|
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| Harness capabilities | `packages/sdk/src/harness/types.ts` |
| CC WebSearchTool | `src/tools/WebSearchTool/WebSearchTool.ts` |

## Recommendation
Phase 2. Medium priority. Web search is a fundamental capability for research-oriented
processes. Start with API-based implementation (configurable provider), then add
MCP-routed and harness-delegated fallbacks.
