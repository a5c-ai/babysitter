# Setup Guide

This guide covers the current packaged surface for `@a5c-ai/tasks-adapter`.

## Prerequisites

- Node.js 22+
- npm

## Install

From the published package:

```bash
npm install @a5c-ai/tasks-adapter
```

From the monorepo root while working on this package:

```bash
npm install
npm run build --workspace=@a5c-ai/tasks-adapter
```

## Package Topology

`packages/adapters/tasks/` is a single workspace package. The published tarball contains only:

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
npm run build --workspace=@a5c-ai/tasks-adapter
npm run typecheck --workspace=@a5c-ai/tasks-adapter
npm run test --workspace=@a5c-ai/tasks-adapter
npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-adapter
```

`test:packaged-surface-parity` is the packaged-surface parity gate (`src/__tests__/packaged-surface-parity.test.ts`): it builds and packs the adapter, installs the exact tarball into a clean temporary consumer, imports the root plus every `exports` subpath, and typechecks a consumer. In CI it runs in the `test` job of `.github/workflows/ci.yml` and in the `validate_mux` prepublication job of `.github/workflows/publish.yml`, in both places strictly (no `--allow-known-failures`): the adapter has no tracked packaging defect left in `scripts/known-package-defects.json` since FIX-002 declared `@modelcontextprotocol/sdk` as a direct runtime dependency.

## CLI Setup

The package declares two bins. `adapters-tasks` (`./dist/cli/index.js`) is the
supported executable and the one used throughout this guide. `tasks-adapter`
(`./dist/cli/tasks-adapter.js`) is a deprecation shim kept for the previous bin
name: it writes a deprecation notice to stderr and then loads the same CLI
entrypoint. Both are checked by `npm run test:binary-renames`
(`scripts/check-binary-renames.cjs`), which proves each bin target is actually
emitted by the build.

```bash
adapters-tasks --help
adapters-tasks responders list
adapters-tasks responders show security-responder
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

`adapters-tasks server start` launches the packaged MCP server over stdio. That is the supported CLI entrypoint for editor and agent integrations.

Using the published package:

```json
{
  "mcpServers": {
    "adapters-tasks": {
      "command": "npx",
      "args": ["-y", "@a5c-ai/tasks-adapter", "server", "start"]
    }
  }
}
```

Using a local monorepo checkout after building the package:

```json
{
  "mcpServers": {
    "adapters-tasks": {
      "command": "node",
      "args": ["packages/adapters/tasks/dist/cli/index.js", "server", "start"]
    }
  }
}
```

`server start` respects the package CLI globals, so local integrations can also pass `--responder-dir`, `--repo-root`, and `--config-root` when responder discovery needs to point at a specific checkout.

The package also exports HTTP MCP helpers from `@a5c-ai/tasks-adapter/mcp`, but HTTP transport is a programmatic API surface, not a separate CLI package or command.

## Registered MCP Tools

`src/mcp/server.ts` is the authoritative registration list. Every tool below is
registered unconditionally, in this order, and
`src/__tests__/mcp-documented-surface.test.ts` fails if this table and that file
disagree. Parameter schemas live in `src/mcp/tools/*` (`<tool>Params`); the
column below records them at the time of writing.

| Tool | Side | Current parameters |
| --- | --- | --- |
| `ask_breakpoint` | submitter | `question`, `context`, `markdown`, `codeSnippets`, `fileReferences`, `tags`, `domain`, `urgency`, `interactionKind`, `targetResponders`, `routingStrategy`, `timeout`, `breakpointId`, `backend`, `breakpointsDir`, `proven` |
| `check_breakpoint_status` | submitter | `breakpointId`, `backend`, `breakpointsDir` |
| `list_breakpoints` | submitter | `responderId`, `backend`, `breakpointsDir` |
| `create_todo` | submitter | `title`, `description`, `responderId`, `responderType`, `adapter`, `model`, `provider`, `trackerBackend`, `fallbackType`, `tags`, `domain`, `urgency`, `priority`, `dependsOn`, `sourceUrl`, `metadata`, `projectId`, `repoId`, `backend`, `breakpointsDir` |
| `create_task` | submitter | `title`, `instructions`, `responderId`, `responderType`, `adapter`, `model`, `provider`, `trackerBackend`, `fallbackType`, `tags`, `domain`, `urgency`, `priority`, `dependsOn`, `sourceUrl`, `metadata`, `projectId`, `repoId`, `backend`, `breakpointsDir` |
| `assign_task` | submitter | `taskId`, `title`, `instructions`, `assignee`, `responderId`, `responderType`, `adapter`, `model`, `provider`, `trackerBackend`, `fallbackType`, `tags`, `domain`, `urgency`, `priority`, `dependsOn`, `sourceUrl`, `metadata`, `projectId`, `repoId`, `backend`, `breakpointsDir` |
| `search_tasks` | submitter | `query`, `status`, `priority`, `assigneeId`, `responderId`, `domain`, `tags`, `sortBy`, `sortDirection`, `offset`, `limit`, `backend`, `breakpointsDir` |
| `cancel_breakpoint` | submitter | `breakpointId`, `backend`, `breakpointsDir` |
| `add_comment` | submitter | `taskId`, `authorId`, `authorName`, `text`, `metadata`, `backend`, `breakpointsDir` |
| `add_comment_to_breakpoint` | submitter | `breakpointId`, `authorId`, `authorName`, `text`, `metadata`, `backend`, `breakpointsDir` |
| `bulk_update_tasks` | submitter | `ids`, `action`, `actorId`, `assigneeId`, `assigneeName`, `status`, `message`, `backend`, `breakpointsDir` |
| `task_stats` | submitter | `status`, `priority`, `assigneeId`, `responderId`, `tags`, `domain`, `backend`, `breakpointsDir` |
| `export_tasks` | submitter | `status`, `priority`, `assigneeId`, `responderId`, `tags`, `domain`, `backend`, `breakpointsDir` |
| `escalate` | submitter | `taskId`, `title`, `reason`, `targetResponderId`, `responderId`, `responderType`, `adapter`, `model`, `provider`, `trackerBackend`, `fallbackType`, `tags`, `domain`, `urgency`, `priority`, `dependsOn`, `sourceUrl`, `metadata`, `projectId`, `repoId`, `backend`, `breakpointsDir` |
| `escalate_breakpoint` | submitter | `breakpointId`, `reason`, `targetResponderId`, `responderId`, `responderType`, `adapter`, `model`, `provider`, `trackerBackend`, `fallbackType`, `tags`, `domain`, `urgency`, `priority`, `dependsOn`, `sourceUrl`, `metadata`, `projectId`, `repoId`, `backend`, `breakpointsDir` |
| `answer_breakpoint` | submitter | `breakpointId`, `text`, `approved`, `responderId`, `responderName`, `confidence`, `references`, `sign`, `keyFingerprint`, `backend`, `breakpointsDir` |
| `verify_breakpoint_answer` | submitter | `breakpointId`, `backend`, `breakpointsDir` |
| `list_responders` | responder | `domain`, `tags`, `backend`, `breakpointsDir` |
| `claim_breakpoint` | responder | `breakpointId`, `responderId`, `backend`, `breakpointsDir` |
| `poll_breakpoints` | responder | `responderId`, `waitSeconds`, `backend`, `breakpointsDir` |

## Configuration

CLI and MCP clients resolve connection settings in this order:

- `--server-url`
- `BMUX_SERVER_URL`
- `SERVER_URL`
- `~/.adapters-tasks/config.json`
- default server URL baked into the client

Bearer tokens resolve in this order:

- `--auth-token`
- `BMUX_AUTH_TOKEN`
- `AUTH_TOKEN`
- `~/.adapters-tasks/config.json`
- `~/.adapters-tasks/auth.json`

Shared auth commands:

```bash
adapters-tasks auth status
adapters-tasks auth server set https://adapters-tasks.example.com
adapters-tasks auth token set <token>
```

## Responder Bootstrap

Create responder profiles under `.a5c/responder/<responderId>.json`, then validate them with:

```bash
adapters-tasks responders show <responderId>
```

Use these CLI commands once profiles exist:

```bash
adapters-tasks breakpoints pending --responder <responderId>
adapters-tasks responder-loop --responder <responderId> --once
```
