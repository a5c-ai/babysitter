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

## Harness Runtime CLI: `babysitter-agent`

The optional runtime binary comes from [`@a5c-ai/babysitter-agent`](../../packages/babysitter-agent/package.json) and is registered as `babysitter-agent` with `babysitter-harness` kept only as a compatibility binary.

Use `babysitter-agent call` for new runtime orchestration examples. The legacy `babysitter harness:call` alias has been removed and must not appear in new tests or docs.

Setup remains on the core CLI through `babysitter harness:install` and `babysitter harness:install-plugin`.

Use it for human-invoked orchestration sessions and runtime services:

- `create-run`, `call`, `yolo`, `plan`, `forever`
- `resume-run`, `resume`
- `retrospect`, `cleanup`, `assimilate`, `doctor`, `contrib`
- `anycli`, `session-history`
- `observe`, `tui`
- `daemon:*`, `cost:stats`, `start-server`
- `discover`, `list`, `invoke`

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
