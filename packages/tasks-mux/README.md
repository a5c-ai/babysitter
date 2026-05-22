# @a5c-ai/tasks-mux

Breakpoint routing library, MCP server, and CLI for responder-driven review flows.

## Install

Use the published npm package in consumers. Install it locally in a project or run it directly with `npx`.

```bash
npm install --save-dev @a5c-ai/tasks-mux
npx --yes @a5c-ai/tasks-mux --help
```

## CLI

The published executable is `tasks-mux`. The supported consumer workflow is either:

- run the published package with `npx --yes @a5c-ai/tasks-mux ...`
- install `@a5c-ai/tasks-mux` and invoke `tasks-mux ...`

```bash
npx --yes @a5c-ai/tasks-mux --help
npx --yes @a5c-ai/tasks-mux responders list
npx --yes @a5c-ai/tasks-mux auth login
npx --yes @a5c-ai/tasks-mux server start
```

If the published package is already installed locally or globally, use the bin directly:

```bash
tasks-mux --help
tasks-mux auth server set https://tasks-mux.a5c.ai
tasks-mux auth login
```

Current CLI commands:

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

## MCP Tools

The MCP server currently registers these tools:

- `ask_breakpoint`
- `check_breakpoint_status`
- `list_breakpoints`
- `answer_breakpoint`
- `verify_breakpoint_answer`
- `list_responders`
- `claim_breakpoint`
- `poll_breakpoints`

## Package Exports

Published subpath exports:

- `.`
- `./backends`
- `./proven`
- `./mcp`
- `./harness`
- `./auth`
- `./config`

Example:

```ts
import {
  createBackend,
  createBreakpointMcpServer,
  BreakpointMuxInteractionProvider,
} from "@a5c-ai/tasks-mux";
```

## Published Package Contents

The npm tarball is intentionally limited to:

- `dist/`
- `responder/`
- `README.md`

`docs/`, `skills/`, and `specs/` are repository source docs and are not published files.

## Validation

```bash
npm run build --workspace=@a5c-ai/tasks-mux
npm run typecheck --workspace=@a5c-ai/tasks-mux
npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-mux
npm pack --json --dry-run --workspace=@a5c-ai/tasks-mux
```

Keep this README aligned with the exported CLI, MCP, and package topology surfaced by `packages/tasks-mux/`.
