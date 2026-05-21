# tasks-mux Architecture Specification

## Version and Identity

- Package: `@a5c-ai/tasks-mux`
- Package version: `5.0.0`
- CLI surface version: `5.0.0`
- MCP server identity: `tasks-mux@0.1.0`
- Status: current packaged surface reference
- Date: 2026-04-27

## Package Topology

Package root: `packages/tasks-mux/`

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

The packaged CLI program name and npm bin name are both `tasks-mux`.

Supported command paths:

- `tasks-mux ask`
- `tasks-mux responders list`
- `tasks-mux responders show <responderId>`
- `tasks-mux breakpoints pending --responder <responderId>`
- `tasks-mux breakpoints answer <breakpointId> --answer <text> --responder <responderId> [--confidence <0-100>]`
- `tasks-mux breakpoints status <breakpointId>`
- `tasks-mux breakpoints poll <breakpointId> [--timeout <seconds>] [--interval <seconds>]`
- `tasks-mux responder-loop --responder <responderId> [--interval <seconds>] [--once]`
- `tasks-mux server start`
- `tasks-mux auth login|logout|status|server set|server clear|token set|token clear|keygen|key-push|keys`

Global options on the top-level program:

- `--server-url <url>`
- `--auth-token <token>`
- `--json`
- `--responder-dir <path>`
- `--repo-root <path>`
- `--config-root <path>`

`server start` starts the stdio MCP server. HTTP transport exists as a programmatic export from `./mcp`, not as a separate CLI package or command tree.

## Current MCP Tool Surface

The stdio MCP server registers exactly eight tools:

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

## Packaging Facts

The package surface intentionally separates published runtime files from repository documentation:

- `package.json#files` stays limited to `dist`, `responder`, and `README.md`
- `docs/`, `skills/`, and `specs/` exist to support source review and contributor workflows
- the parity gate lives in `src/__tests__/packaged-surface-parity.test.ts` so the package can detect doc drift locally

## Guardrail Expectations

Documentation in this package must stay aligned with:

- the CLI bin name `tasks-mux`
- the CLI version and package version `5.0.0`
- the MCP server identity version `0.1.0`
- the current command tree in `src/cli/program.ts`
- the current tool registry in `src/mcp/server.ts`
