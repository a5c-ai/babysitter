# Setup Guide

This guide covers the current packaged surface for `@a5c-ai/agent-mux-tasks`.

## Prerequisites

- Node.js 22+
- npm

## Install

From the published package:

```bash
npm install @a5c-ai/agent-mux-tasks
```

From the monorepo root while working on this package:

```bash
npm install
npm run build --workspace=@a5c-ai/agent-mux-tasks
```

## Package Topology

`packages/agent-mux/tasks/` is a single workspace package. The published tarball contains only:

- `dist/`
- `responder/`
- `README.md`

The repository also keeps source docs in `docs/`, `skills/`, and `specs/`, but those folders are not published files.

Published subpath exports:

- `.`
- `./backends`
- `./proven`
- `./mcp`
- `./harness`
- `./auth`
- `./config`

Source layout:

- CLI source: `src/cli/index.ts`, `src/cli/program.ts`, `src/cli/commands/*`
- MCP source: `src/mcp/index.ts`, `src/mcp/server.ts`, `src/mcp/http-transport.ts`, `src/mcp/tools/*`

## Build, Test, and Typecheck

Run these from the monorepo root:

```bash
npm run build --workspace=@a5c-ai/agent-mux-tasks
npm run typecheck --workspace=@a5c-ai/agent-mux-tasks
npm run test --workspace=@a5c-ai/agent-mux-tasks
npm run test:packaged-surface-parity --workspace=@a5c-ai/agent-mux-tasks
```

## CLI Setup

The bin name is `tasks-mux`.

```bash
tasks-mux --help
tasks-mux responders list
tasks-mux responders show security-responder
```

Global CLI options:

- `--server-url <url>`
- `--auth-token <token>`
- `--json`
- `--responder-dir <path>`
- `--repo-root <path>`
- `--config-root <path>`

Responder profiles are resolved from `.a5c/responder/` by default. You can override that resolution with `--responder-dir`, `--repo-root`, or `--config-root`.

## MCP Server Setup

`tasks-mux server start` launches the packaged MCP server over stdio. That is the supported CLI entrypoint for editor and agent integrations.

Using the published package:

```json
{
  "mcpServers": {
    "tasks-mux": {
      "command": "npx",
      "args": ["-y", "@a5c-ai/agent-mux-tasks", "server", "start"]
    }
  }
}
```

Using a local monorepo checkout after building the package:

```json
{
  "mcpServers": {
    "tasks-mux": {
      "command": "node",
      "args": ["packages/agent-mux/tasks/dist/cli/index.js", "server", "start"]
    }
  }
}
```

`server start` respects the package CLI globals, so local integrations can also pass `--responder-dir`, `--repo-root`, and `--config-root` when responder discovery needs to point at a specific checkout.

The package also exports HTTP MCP helpers from `@a5c-ai/agent-mux-tasks/mcp`, but HTTP transport is a programmatic API surface, not a separate CLI package or command.

## Registered MCP Tools

The stdio server currently registers these eight tools:

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

## Configuration

CLI and MCP clients resolve connection settings in this order:

- `--server-url`
- `BMUX_SERVER_URL`
- `SERVER_URL`
- `~/.tasks-mux/config.json`
- default server URL baked into the client

Bearer tokens resolve in this order:

- `--auth-token`
- `BMUX_AUTH_TOKEN`
- `AUTH_TOKEN`
- `~/.tasks-mux/config.json`
- `~/.tasks-mux/auth.json`

Shared auth commands:

```bash
tasks-mux auth status
tasks-mux auth server set https://tasks-mux.example.com
tasks-mux auth token set <token>
```

## Responder Bootstrap

Create responder profiles under `.a5c/responder/<responderId>.json`, then validate them with:

```bash
tasks-mux responders show <responderId>
```

Use these CLI commands once profiles exist:

```bash
tasks-mux breakpoints pending --responder <responderId>
tasks-mux responder-loop --responder <responderId> --once
```
