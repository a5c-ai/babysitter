# agent-mux-tasks Architecture Specification

## Version and Identity

- Package: `@a5c-ai/agent-mux-tasks`
- Package version: `5.0.0`
- CLI surface version: `5.0.0`
- MCP server identity: `agent-mux-tasks@0.1.0`
- Status: current packaged surface reference
- Date: 2026-04-27

## Package Topology

Package root: `packages/agent-mux/tasks/`

Published npm files:

- `dist/`
- `responder/`
- `README.md`

Repository-only source docs:

- `docs/`
- `skills/`
- `specs/`

Published subpath exports:

- `.`
- `./backends`
- `./proven`
- `./mcp`
- `./harness`
- `./auth`
- `./config`

Source layout:

- CLI: `src/cli/index.ts`, `src/cli/program.ts`, `src/cli/commands/*`
- MCP: `src/mcp/index.ts`, `src/mcp/server.ts`, `src/mcp/http-transport.ts`, `src/mcp/tools/*`
- Public barrel: `src/index.ts`

## Current CLI Surface

The packaged CLI program name and npm bin name are both `agent-mux-tasks`.

Supported command paths:

- `agent-mux-tasks ask`
- `agent-mux-tasks responders list`
- `agent-mux-tasks responders show <responderId>`
- `agent-mux-tasks breakpoints pending --responder <responderId>`
- `agent-mux-tasks breakpoints answer <breakpointId> --answer <text> --responder <responderId> [--confidence <0-100>]`
- `agent-mux-tasks breakpoints status <breakpointId>`
- `agent-mux-tasks breakpoints poll <breakpointId> [--timeout <seconds>] [--interval <seconds>]`
- `agent-mux-tasks tasks search [--query <text>] [--status <csv>] [--priority <csv>] [--assignee <id>]`
- `agent-mux-tasks tasks assign <taskId> --assignee <id> [--assignee-name <name>]`
- `agent-mux-tasks tasks approve <taskId> --responder <id> --responder-name <name> --text <text>`
- `agent-mux-tasks tasks close <taskId> [--message <text>]`
- `agent-mux-tasks tasks cancel <taskId>`
- `agent-mux-tasks tasks transition <taskId> --status <status> [--message <text>]`
- `agent-mux-tasks tasks comment <taskId> --author <id> --text <text>`
- `agent-mux-tasks tasks bulk --ids <csv> --action <approve|close|cancel|reassign|transition>`
- `agent-mux-tasks tasks stats`
- `agent-mux-tasks tasks export`
- `agent-mux-tasks responder-loop --responder <responderId> [--interval <seconds>] [--once]`
- `agent-mux-tasks server start`
- `agent-mux-tasks auth login|logout|status|server set|server clear|token set|token clear|keygen|key-push|keys`

Global options on the top-level program:

- `--server-url <url>`
- `--auth-token <token>`
- `--json`
- `--responder-dir <path>`
- `--repo-root <path>`
- `--config-root <path>`

`server start` starts the stdio MCP server. HTTP transport exists as a programmatic export from `./mcp`, not as a separate CLI package or command tree.

## Current MCP Tool Surface

The stdio MCP server registers these tools:

| Tool | Current parameters |
| --- | --- |
| `ask_breakpoint` | `question`, `context`, `markdown`, `codeSnippets`, `fileReferences`, `tags`, `domain`, `urgency`, `interactionKind`, `targetResponders`, `routingStrategy`, `timeout`, `breakpointId`, `backend`, `breakpointsDir`, `proven` |
| `check_breakpoint_status` | `breakpointId`, `backend`, `breakpointsDir` |
| `list_breakpoints` | `responderId`, `backend`, `breakpointsDir` |
| `answer_breakpoint` | `breakpointId`, `text`, `approved`, `responderId`, `responderName`, `confidence`, `references`, `sign`, `keyFingerprint`, `backend`, `breakpointsDir` |
| `verify_breakpoint_answer` | `breakpointId`, `backend`, `breakpointsDir` |
| `list_responders` | `domain`, `tags`, `backend`, `breakpointsDir` |
| `claim_breakpoint` | `breakpointId`, `responderId`, `backend`, `breakpointsDir` |
| `poll_breakpoints` | `responderId`, `waitSeconds`, `backend`, `breakpointsDir` |
| `create_todo` | `title`, `description`, routing/context fields, `priority`, `dependsOn`, `backend`, `breakpointsDir` |
| `assign_task` | `taskId`, `title`, `instructions`, `assignee`, routing/context fields, `priority`, `dependsOn`, `backend`, `breakpointsDir` |
| `search_tasks` | `query`, `status`, `priority`, `assigneeId`, `responderId`, `domain`, `tags`, `sortBy`, `sortDirection`, `offset`, `limit`, `backend`, `breakpointsDir` |
| `add_comment` | `taskId`, `authorId`, `authorName`, `text`, `metadata`, `backend`, `breakpointsDir` |
| `bulk_update_tasks` | `ids`, `action`, `actorId`, `assigneeId`, `assigneeName`, `status`, `message`, `backend`, `breakpointsDir` |
| `task_stats` | `status`, `priority`, `assigneeId`, `responderId`, `tags`, `domain`, `backend`, `breakpointsDir` |
| `export_tasks` | `status`, `priority`, `assigneeId`, `responderId`, `tags`, `domain`, `backend`, `breakpointsDir` |
| `escalate` | `taskId`, `title`, `reason`, `targetResponderId`, routing/context fields, `backend`, `breakpointsDir` |

## Task Management Contract

`Breakpoint` remains the canonical persisted shape. Task-management fields are additive: `priority`, `dependsOn`, `assigneeId`, `assigneeName`, `comments`, `history`, `auditLog`, `forms`, `formSubmissions`, `sla`, `metrics`, `notifications`, and `escalation`. Existing breakpoint JSON without these fields remains valid and receives defaults when parsed.

The git-native backend implements the local durable task-management contract: search/filter/sort/pagination, assignment/reassignment, validated lifecycle transitions, discussion comments, history/audit append, bulk operations with per-item results, metrics grouped by status/priority, and redacted export. Server, GitHub Issues, external-tracker, and agent-mux backends expose capability metadata and should return explicit unsupported-feature errors for operations that cannot be mapped safely.

## Packaging Facts

The package surface intentionally separates published runtime files from repository documentation:

- `package.json#files` stays limited to `dist`, `responder`, and `README.md`
- `docs/`, `skills/`, and `specs/` exist to support source review and contributor workflows
- the parity gate lives in `src/__tests__/packaged-surface-parity.test.ts` so the package can detect doc drift locally

## Guardrail Expectations

Documentation in this package must stay aligned with:

- the CLI bin name `agent-mux-tasks`
- the CLI version and package version `5.0.0`
- the MCP server identity version `0.1.0`
- the current command tree in `src/cli/program.ts`
- the current tool registry in `src/mcp/server.ts`
