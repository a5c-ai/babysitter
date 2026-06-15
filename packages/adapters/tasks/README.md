# @a5c-ai/tasks-adapter

Breakpoint routing library, MCP server, and CLI for responder-driven review flows.

## Install

Use the published npm package in consumers. Install it locally in a project or run it directly with `npx`.

```bash
npm install --save-dev @a5c-ai/tasks-adapter
npx --yes @a5c-ai/tasks-adapter --help
```

## CLI

The published executable is `adapters-tasks`. The supported consumer workflow is either:

- run the published package with `npx --yes @a5c-ai/tasks-adapter ...`
- install `@a5c-ai/tasks-adapter` and invoke `adapters-tasks ...`

```bash
npx --yes @a5c-ai/tasks-adapter --help
npx --yes @a5c-ai/tasks-adapter responders list
npx --yes @a5c-ai/tasks-adapter auth login
npx --yes @a5c-ai/tasks-adapter server start
```

If the published package is already installed locally or globally, use the bin directly:

```bash
adapters-tasks --help
adapters-tasks auth server set https://tasks-adapter.a5c.ai
adapters-tasks auth login
```

Current CLI commands:

- `adapters-tasks ask`
- `adapters-tasks responders list`
- `adapters-tasks responders show <responderId>`
- `adapters-tasks breakpoints pending --responder <responderId>`
- `adapters-tasks breakpoints answer <breakpointId> --answer <text> --responder <responderId> [--confidence <0-100>]`
- `adapters-tasks breakpoints status <breakpointId>`
- `adapters-tasks breakpoints poll <breakpointId> [--timeout <seconds>] [--interval <seconds>]`
- `adapters-tasks tasks search [--query <text>] [--status <csv>] [--priority <csv>] [--assignee <id>]`
- `adapters-tasks tasks assign <taskId> --assignee <id> [--assignee-name <name>]`
- `adapters-tasks tasks approve <taskId> --responder <id> --responder-name <name> --text <text>`
- `adapters-tasks tasks close <taskId> [--message <text>]`
- `adapters-tasks tasks cancel <taskId>`
- `adapters-tasks tasks transition <taskId> --status <status> [--message <text>]`
- `adapters-tasks tasks comment <taskId> --author <id> --text <text>`
- `adapters-tasks tasks bulk --ids <csv> --action <approve|close|cancel|reassign|transition>`
- `adapters-tasks tasks stats`
- `adapters-tasks tasks export`
- `adapters-tasks responder-loop --responder <responderId> [--interval <seconds>] [--once]`
- `adapters-tasks server start`
- `adapters-tasks auth login|logout|status|server set|server clear|token set|token clear|keygen|key-push|keys`

The `tasks` command group is backed by the local git-native backend and supports additive task-management fields on breakpoint JSON: `priority`, `dependsOn`, `assigneeId`, comments, history, audit log, metrics, and redacted export data. Existing breakpoint files without these fields remain valid.

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
- `create_todo`
- `assign_task`
- `search_tasks`
- `add_comment`
- `bulk_update_tasks`
- `task_stats`
- `export_tasks`
- `escalate`

Backends advertise task-management capabilities. The git-native backend implements search/filtering, bulk updates, assignment/reassignment, comments, history/audit, metrics, and export. Other backends expose partial capability metadata and should return explicit unsupported-feature errors for operations they cannot safely map to their external API.

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
} from "@a5c-ai/tasks-adapter";
```

## Published Package Contents

The npm tarball is intentionally limited to:

- `dist/`
- `responder/`
- `README.md`

`docs/`, `skills/`, and `specs/` are repository source docs and are not published files.

## Validation

```bash
npm run build --workspace=@a5c-ai/tasks-adapter
npm run typecheck --workspace=@a5c-ai/tasks-adapter
npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-adapter
npm pack --json --dry-run --workspace=@a5c-ai/tasks-adapter
```

Keep this README aligned with the exported CLI, MCP, and package topology surfaced by `packages/adapters/tasks/`.
