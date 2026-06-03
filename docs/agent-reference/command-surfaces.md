# Command Surfaces

This page is the concise command map for contributors and coding agents. It is intentionally grouped by surface so `AGENTS.md` and `CLAUDE.md` do not need to inline large command dumps.

## Core CLI: `babysitter`

The `babysitter` binary is shipped by [`@a5c-ai/babysitter`](../../packages/babysitter/package.json) and [`@a5c-ai/babysitter-sdk`](../../packages/sdk/package.json). The command families currently registered in the repo source live in [`packages/sdk/src/cli/main/program.ts`](../../packages/sdk/src/cli/main/program.ts).

### Agent-facing help

`babysitter --help` is the automation surface. Its usage text is generated from [`packages/sdk/src/cli/main/usage.ts`](../../packages/sdk/src/cli/main/usage.ts) and centers on:

- `run:*` and `task:*` for deterministic replay loops (includes `run:assign-process` for attaching a process to a bare run)
- `session:*` for session binding and iteration guards
- `skill:discover`
- `process-library:active`
- `profile:*`
- `instructions:babysit-skill`
- `harness:install` and `harness:install-plugin`

### Human-facing help

`babysitter --help-human` is the operator surface. It adds:

- `log`, `hook:*`, `compress-output`
- `skill:fetch-remote`
- `process-library:clone|update|use`
- `plugin:*`
- `tokens:stats`
- `compression:*`
- `harness:discover|list`
- `instructions:process-create|orchestrate|breakpoint-handling`
- `breakpoint:*`
- `health`, `configure`, `version`

## Product CLI: `tula`

The product CLI implementation lives in [`@a5c-ai/tula`](../../packages/tula/package.json) and is exposed as `tula`.

Use `tula call` for new runtime orchestration examples. The legacy `babysitter harness:call` alias has been removed and must not appear in new tests or docs.

Setup remains on the core CLI through `babysitter harness:install` and `babysitter harness:install-plugin`.

Use it for human-invoked orchestration sessions and runtime services:

- `create-run`, `call`, `yolo`, `plan`, `forever`
- `resume-run`, `resume`
- `retrospect`, `cleanup`, `assimilate`, `doctor`, `contrib`
- `anycli`, `session-history`
- `observe`, `tui`
- `daemon:*`, `cost:stats`, `start-server`
- `discover`, `list`, `invoke`

## External Agent Dispatch

External agent tasks start as normal `ctx.task()` effects. The difference is the
agent routing hint: `agent.responderType: "agent"` plus a required `adapter`.
During orchestration, tasks-mux chooses the responder backend. Internal
responders continue through the normal agent-core path, human responders use the
breakpoint path, and agent responders route to `AgentMuxResponderBackend`, which
uses agent-mux and the lower-level `amuxBridge` integration.

The command surfaces involved are split by responsibility:

| Surface | Use |
| --- | --- |
| `babysitter run:create`, `run:iterate`, `task:list`, `task:post` | Create and replay the run, inspect pending effects, and post resolved task results. |
| `babysitter process-library:active`, `skill:discover`, `profile:*` | Gather process-authoring context, available skills, and user/project preferences before deciding whether an external responder is appropriate. |
| `tula discover`, `tula list`, `tula invoke` | Human-facing discovery and invocation surface for available runtime agents and services. |
| `adapters doctor`, `adapters launch`, `adapters auth`, `adapters install` | agent-mux checks and adapter operations. See the agent-mux reference for the exact CLI flags. |

Troubleshooting common external agent failures:

| Scenario | Expected behavior |
| --- | --- |
| agent-mux is missing | If the task explicitly allows internal fallback, route internally; otherwise fail the task with an unavailable agent-mux error. |
| Adapter is missing | Fail with an adapter-not-installed message and install guidance for the selected adapter. |
| Adapter is unauthenticated | Fail with an authentication message and run the adapter auth flow before retrying. |
| Task times out | Fail the task with timeout details; include partial output only when the responder backend provides it. |
| Adapter process crashes | Fail the task with the adapter stderr or exit details so the next iteration can diagnose the crash. |
| Fallback is disabled | Do not silently switch to an internal agent. The failed external responder is part of the task result. |

Older design docs may still say `agent.external: true`,
`fallbackToInternal`, or direct `amuxBridge` dispatch. The current contributor
surface should describe the tasks-mux responder route and use
`responderType: "agent"` in new examples.

## Runs Directory Defaults

The repo source now treats global runs storage as the default:

- default scope: `~/.a5c/runs`
- repo scope: `<repo>/.a5c/runs` when `BABYSITTER_RUNS_SCOPE=repo`
- explicit override: `BABYSITTER_RUNS_DIR` or `--runs-dir`

The implementation lives in [`packages/sdk/src/config/runs.ts`](../../packages/sdk/src/config/runs.ts) and the default config in [`packages/sdk/src/config/defaults.ts`](../../packages/sdk/src/config/defaults.ts).

When reading existing runs, the SDK also probes repo-local `.a5c/runs` for backward compatibility.

## Plugin Commands

Plugin concepts are covered in [Plugins Overview](../plugins.md). The dedicated command reference is [Plugin CLI Reference](../plugins/cli-reference.md).

One current implementation detail worth remembering: `plugin:install`, `plugin:update`, and `plugin:configure` can auto-resolve the marketplace when `--marketplace-name` is omitted, as implemented in [`packages/sdk/src/cli/commands/plugin/packageCommands.ts`](../../packages/sdk/src/cli/commands/plugin/packageCommands.ts).
