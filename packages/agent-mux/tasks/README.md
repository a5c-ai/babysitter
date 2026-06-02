# @a5c-ai/agent-mux-tasks

Breakpoint routing library, MCP server, and CLI for responder-driven review flows.

## Install

Use the published npm package in consumers. Install it locally in a project or run it directly with `npx`.

```bash
npm install --save-dev @a5c-ai/agent-mux-tasks
npx --yes @a5c-ai/agent-mux-tasks --help
```

## CLI

The published executable is `agent-mux-tasks`. The supported consumer workflow is either:

- run the published package with `npx --yes @a5c-ai/agent-mux-tasks ...`
- install `@a5c-ai/agent-mux-tasks` and invoke `agent-mux-tasks ...`

```bash
npx --yes @a5c-ai/agent-mux-tasks --help
npx --yes @a5c-ai/agent-mux-tasks responders list
npx --yes @a5c-ai/agent-mux-tasks auth login
npx --yes @a5c-ai/agent-mux-tasks server start
```

If the published package is already installed locally or globally, use the bin directly:

```bash
agent-mux-tasks --help
agent-mux-tasks auth server set https://tasks-mux.a5c.ai
agent-mux-tasks auth login
```

Current CLI commands:

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
} from "@a5c-ai/agent-mux-tasks";
```

## Published Package Contents

The npm tarball is intentionally limited to:

- `dist/`
- `responder/`
- `README.md`

`docs/`, `skills/`, and `specs/` are repository source docs and are not published files.

## Validation

```bash
npm run build --workspace=@a5c-ai/agent-mux-tasks
npm run typecheck --workspace=@a5c-ai/agent-mux-tasks
npm run test:packaged-surface-parity --workspace=@a5c-ai/agent-mux-tasks
npm pack --json --dry-run --workspace=@a5c-ai/agent-mux-tasks
```

Keep this README aligned with the exported CLI, MCP, and package topology surfaced by `packages/agent-mux/tasks/`.
