# Tools Coverage Map: CC (42 tools) vs Babysitter Agentic Tools (16)

This document maps every CC tool to its babysitter equivalent (if any) and identifies
the gaps. Babysitter's agentic tools are defined in `packages/sdk/src/harness/agenticTools.ts`
and injected into Pi sessions. When delegating to CC or other harnesses, those harnesses
provide their own tools -- this map is specifically about what babysitter can provide
when it IS the executing runtime (Pi sessions, direct execution).

## Coverage Matrix

### File Operations (6 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| FileReadTool | `read` | Near parity | Minor -- CC uses absolute paths + `pages` param for PDFs; babysitter uses workspace-relative paths, no PDF page support |
| FileEditTool | `edit` | Parity+ | Babysitter has `replace_all` param that CC lacks |
| FileWriteTool | `write` | Parity | No |
| GlobTool | `find` | Parity | No -- different impl, same functionality |
| GrepTool | `grep` | **Partial** | **GAP-TOOLS-035** |
| NotebookEditTool | `notebook` | Near parity | Minor -- CC uses `cell_id`, babysitter uses `cell_index`; babysitter has `read` action CC lacks |

**GAP-TOOLS-035**: CC's GrepTool has `output_mode` (content/files_with_matches/count),
separate `-B`/`-A`/`-C` params for before_context/after_context/combined context, `-n` line number toggle,
and `head_limit` (default 250). Babysitter only has `context` (equivalent to `-C`), `limit`,
and `offset`. Missing: output mode selection, separate before/after context lines, line
number toggle.

### Execution (3 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| BashTool | `bash` | **Partial** | **GAP-TOOLS-036** |
| PowerShellTool | (none -- bash covers shell) | Partial | Minor |
| REPLTool | `python` (Python only) | Partial | **GAP-TOOLS-007** |

**GAP-TOOLS-007**: CC has JS/TS REPL. Babysitter has `python` tool only. Missing
JS/TS REPL for interactive code evaluation in orchestrated tasks.

**GAP-TOOLS-036**: CC's BashTool has `run_in_background` and `description` params
that babysitter lacks. Babysitter's `bash` has `env` and `cwd` params that CC lacks.
Neither is a superset of the other.

### Web (2 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| WebSearchTool | (none) | Missing | **GAP-TOOLS-008** (exists) |
| WebFetchTool | `fetch` | **Partial** | **GAP-TOOLS-037** |

**GAP-TOOLS-008**: CC has web search. Babysitter has no equivalent.

**GAP-TOOLS-037**: CC's WebFetchTool requires a `prompt` param that processes and
summarizes fetched content before returning it. Babysitter's `fetch` returns raw
response data with `timeout` and `raw` params. Different content processing model.

Note: CC does NOT have a WebBrowserTool. Babysitter's `browser` tool is
babysitter-only (see Babysitter-only tools section below).

### Agent/Delegation (3 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| AgentTool | (effect system) | Different model | See GAP-AGENT-001 |
| SendMessageTool | (none) | Missing | **GAP-TOOLS-015** merged into GAP-AGENT-005 |
| SyntheticOutputTool | (none) | Missing | **GAP-TOOLS-029** |

**GAP-TOOLS-029**: CC's SyntheticOutputTool creates structured output blocks
(images, code blocks, downloadable files) that appear in the conversation. No
equivalent for producing structured output from orchestrated tasks.

### Task Management (6 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| TaskCreateTool | (effect system via ctx.task) | Different model | **GAP-TOOLS-014** (exists) |
| TaskGetTool | (task:show CLI) | CLI-only | **GAP-TOOLS-014** (exists) |
| TaskListTool | (task:list CLI) | CLI-only | **GAP-TOOLS-014** (exists) |
| TaskUpdateTool | (task:post CLI) | CLI-only | **GAP-TOOLS-014** (exists) |
| TaskStopTool | (none) | Missing | **GAP-TOOLS-030** |
| TaskOutputTool | (task:show CLI) | CLI-only | **GAP-TOOLS-014** (exists) |

**GAP-TOOLS-030**: No ability to cancel/stop a running effect. Once dispatched,
effects run to completion or timeout. CC can cancel background tasks mid-execution.

### MCP Tools (4 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| MCPTool | (none) | Missing | **GAP-TOOLS-025** (exists) |
| ListMcpResourcesTool | (none) | Missing | **GAP-TOOLS-031** |
| ReadMcpResourceTool | (none) | Missing | **GAP-TOOLS-031** |
| McpAuthTool | (none) | Missing | **GAP-TOOLS-032** |

**GAP-TOOLS-031**: MCP resource browsing and reading. CC can list and read
resources from connected MCP servers. Babysitter has no MCP resource support.

**GAP-TOOLS-032**: MCP authentication. CC handles OAuth flows for MCP servers
that require auth (e.g., Slack, Gmail, Calendar). No auth in babysitter's MCP.

### User Interaction (1 CC tool)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| AskUserQuestionTool | `ask` | **Partial** | **GAP-TOOLS-038** |

**GAP-TOOLS-038**: CC's AskUserQuestionTool is a single free-text question model.
Babysitter's `ask` is a structured multi-question tool with options, multi-select,
and recommended index. Different interaction models -- babysitter is richer but
not a drop-in replacement for CC's simple question flow.

### Planning (2 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| EnterPlanModeTool | (none) | Missing | **GAP-TOOLS-018** (exists) |
| ExitPlanModeTool | (none) | Missing | **GAP-TOOLS-018** (exists) |

### Worktree (2 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| EnterWorktreeTool | (none) | Missing | **GAP-TOOLS-017** (exists) |
| ExitWorktreeTool | (none) | Missing | **GAP-TOOLS-017** (exists) |

### Configuration (2 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| ConfigTool | (none) | Missing | **GAP-TOOLS-033** |
| ToolSearchTool | (none) | Missing | **GAP-TOOLS-034** |

**GAP-TOOLS-033**: Runtime configuration tool. CC can modify settings during a
session. Babysitter's `configure` command exists but not as an agentic tool.

**GAP-TOOLS-034**: Tool discovery/search. CC has ToolSearchTool for deferred tool
loading. Babysitter's Pi sessions have all tools loaded upfront -- no dynamic
discovery. This becomes important with MCP tools.

### Scheduling (2 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| ScheduleCronTool | (none) | Missing | **GAP-TOOLS-020** (exists) |
| RemoteTriggerTool | (none) | Missing | **GAP-TOOLS-021** (exists) |

### CC-Specific (5 CC tools -- removed as host harness concerns)

| CC Tool | Babysitter Status | Reason |
|---------|------------------|--------|
| BriefTool | Removed | CC proactive mode feature |
| TodoWriteTool | Removed | CC in-session task list |
| MonitorTool | Removed | CC resource monitoring |
| TeamCreateTool | Removed | CC agent teams (covered by GAP-AGENT-001 sub-harness isolation) |
| TeamDeleteTool | Removed | CC agent teams (covered by GAP-AGENT-001 sub-harness isolation) |

### Special (4 CC tools)

| CC Tool | Babysitter Agentic Tool | Status | Gap? |
|---------|------------------------|--------|------|
| SkillTool | (none as agentic tool) | Missing | **GAP-TOOLS-027** (exists) |
| SleepTool | (ctx.sleepUntil effect) | Different model | **GAP-TOOLS-028** (exists) |
| LSPTool | (none) | Missing | **GAP-TOOLS-012** (LSP Integration for Code-Aware Routing) |
| DiscoverSkillsTool | (none) | Missing | **GAP-TOOLS-027** (Skill Discovery/Invocation from Processes) |

### Babysitter-only tools (no CC equivalent)

| Babysitter Tool | Description |
|-----------------|-------------|
| `browser` | Headless browser via puppeteer -- navigate, click, type, evaluate, screenshot, close |
| `ssh` | SSH remote execution |
| `calc` | Calculator/math evaluation |
| `ast_grep` | AST-aware code search |
| `ast_edit` | AST-aware code transformation |
| `render_mermaid` | Mermaid diagram rendering |

## Summary

| Category | CC Tools | Babysitter Has | Gap Count |
|----------|----------|----------------|-----------|
| File ops | 6 | 6 (1 partial, 2 near-parity, 1 parity+, 2 parity) | 1 new (grep partial) |
| Execution | 3 | 2 (both partial) | 1 existing + 1 new |
| Web | 2 | 1 (partial) | 1 existing + 1 new |
| Agent/Delegation | 3 | 0 (different model) | 1 new |
| Task Management | 6 | 0 (CLI only) | 1 existing + 1 new |
| MCP | 4 | 0 | 1 existing + 2 new |
| User Interaction | 1 | 1 (partial) | 1 new |
| Planning | 2 | 0 | 1 existing |
| Worktree | 2 | 0 | 1 existing |
| Configuration | 2 | 0 | 2 new |
| Scheduling | 2 | 0 | 2 existing |
| CC-specific | 5 | N/A (removed) | 0 |
| Special | 4 | 0 (1 effect-based) | 3 existing (TOOLS-012, TOOLS-027, TOOLS-028) |
| **Total** | **42** | **16** | **All CC tools mapped to existing gaps** |

## New Gaps to Create

- **GAP-TOOLS-007**: JS/TS REPL tool (CC's REPLTool equivalent)
- **GAP-TOOLS-029**: Structured output tool (CC's SyntheticOutputTool equivalent)
- **GAP-TOOLS-030**: Effect cancellation tool (CC's TaskStopTool equivalent)
- **GAP-TOOLS-031**: MCP resource browsing/reading tools
- **GAP-TOOLS-032**: MCP authentication tool
- **GAP-TOOLS-033**: Runtime configuration tool
- **GAP-TOOLS-034**: Dynamic tool discovery/search tool
- **GAP-TOOLS-035**: Grep output modes and context params (CC GrepTool parity)
- **GAP-TOOLS-036**: Bash background execution and description params (CC BashTool parity)
- **GAP-TOOLS-037**: Fetch content processing/prompt param (CC WebFetchTool parity)
- **GAP-TOOLS-038**: Ask tool interaction model alignment (CC AskUserQuestionTool parity)

## Feature Gap Details for Partial-Parity Tools

This section details exactly what each partial-parity tool needs to reach full CC parity.

### `grep` (GAP-TOOLS-035)

Current babysitter params: `pattern`, `path`, `glob`, `type`, `i`, `context`, `limit`, `offset`, `multiline`

Missing CC params:
- **`output_mode`**: CC supports `content` (matching lines), `files_with_matches` (file paths only, default), and `count` (match counts). Babysitter always returns content.
- **`-B` (before context)**: CC allows separate before-match context lines. Babysitter only has `-C` equivalent (`context`).
- **`-A` (after context)**: CC allows separate after-match context lines.
- **`-n` (line numbers)**: CC has a toggle for line numbers in output (default true). Babysitter has no toggle.
- **`head_limit`**: CC defaults to 250 lines max output. Babysitter uses `limit`/`offset` differently.

### `bash` (GAP-TOOLS-036)

Current babysitter params: `command`, `timeout`, `env`, `cwd`

Missing CC params:
- **`run_in_background`**: CC can run commands in the background and be notified on completion. Babysitter always runs synchronously.
- **`description`**: CC requires a human-readable description of what the command does. Babysitter has no equivalent.

Babysitter-only params (CC lacks):
- **`env`**: Babysitter can pass environment variables to the command.
- **`cwd`**: Babysitter can set the working directory. CC infers from context.

### `fetch` (GAP-TOOLS-037)

Current babysitter params: `url`, `method`, `headers`, `body`, `timeout`, `raw`

Missing CC params:
- **`prompt`**: CC requires a prompt that describes how to process/summarize the fetched content before returning it. This is a fundamentally different approach -- CC returns AI-processed content, babysitter returns raw HTTP responses.

### `read` (Near parity -- minor gap)

Current babysitter params: `path`, `offset`, `limit`

Missing CC params:
- **`pages`**: CC supports a `pages` param for reading specific page ranges from PDF files (e.g., "1-5", "10-20"). Babysitter has no PDF page selection.

CC uses absolute paths; babysitter uses workspace-relative paths (design choice, not a gap).

### `ask` (GAP-TOOLS-038)

CC model: Single question, free-text response. Simple prompt-and-answer interaction.

Babysitter model: Structured multi-question with `options` (array of choices), `multi_select`
(boolean), and `recommended` (index). Supports complex approval workflows.

These are fundamentally different interaction models. Babysitter's is richer but cannot
replicate CC's simple free-text flow without ignoring its structured fields. Alignment
may require supporting both modes or adding a `mode` parameter.
