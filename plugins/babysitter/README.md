# Babysitter Plugin for Claude Code

Babysitter is the Claude Code plugin for SDK-backed orchestration with
event-sourced runs, stop-hook continuation, native hook dispatch, and human
approval gates.

## Active Orchestration Contract

Claude Code is the canonical hook-driven harness:

- `SessionStart` prepares baseline session state
- the babysit skill or plugin command surface starts and resumes runs
- Claude performs one orchestration phase per turn
- after each posted effect, the assistant stops and the stop hook decides
  whether to block or approve exit
- the run finishes only when `completionProof` is emitted and returned as
  `<promise>...</promise>`

Do not document multi-iteration loops inside a single turn.

## Active Process-Library Model

Process discovery should prefer:

1. `.a5c/processes` in the current workspace
2. The SDK-managed active process-library binding returned by `babysitter process-library:active --json`
3. Other installed skill/plugin roots only as compatibility fallback
4. Reference/bundled content only as last resort

The process library is active-use and layered. Docs should not frame it as a
single bundled snapshot or as a team/project-scoped library only.

## Task Kinds

Current generated-process guidance:

- prefer `agent`
- prefer `skill` when a matching installed skill exists
- allow `shell` for existing tooling/tests/builds
- use `breakpoint` for approval gates
- use `sleep` for time gates

Do not document `node` as an allowed generated effect kind for current
Babysitter processes.

## Runtime Ownership

The Claude-facing README should stay on the Claude skill and hook experience.
Low-level Babysitter runtime mechanics such as run creation, result posting,
binding, and compatibility fallbacks belong in the babysit skill and hook
implementation docs, not in this top-level README.

## Breakpoints

Interactive breakpoint rules:

- require explicit approve/reject choices
- empty or ambiguous answers are not approval
- rejection is still posted with `--status ok` and `approved: false`
- the assistant must not auto-approve breakpoints in interactive mode

## Native Hooks

The plugin dispatches native Babysitter hooks from these priority tiers:

1. `.a5c/hooks/<hook-type>/`
2. `~/.config/babysitter/hooks/<hook-type>/`
3. `plugins/babysitter/hooks/<hook-type>/`

Common hook points:

- `on-run-start`
- `on-iteration-start`
- `on-iteration-end`
- `on-task-start`
- `on-task-complete`
- `on-breakpoint`
- `on-run-complete`
- `on-run-fail`

## Key Files

- `plugins/babysitter/plugin.json`
- `plugins/babysitter/hooks/`
- `plugins/babysitter/skills/babysit/SKILL.md`
- `library/`

## Installation

Install the Claude Code plugin through the Claude plugin installer or the SDK
CLI helper:

```bash
claude plugin marketplace add a5c-ai/babysitter
claude plugin install --scope user babysitter@a5c.ai
```

The SDK helper runs the same published Claude plugin flow:

```bash
babysitter harness:install-plugin claude-code
```

Then restart Claude Code. The installer does not materialize a repo-local
plugin copy.

If the workspace does not already have an active process-library binding, this command bootstraps the shared global SDK process library automatically:

```bash
babysitter process-library:active --json
```

## Quick Start

In Claude Code, invoke the skill or the plugin commands and let the harness own
the loop. The assistant should iterate once, post results, stop, and resume via
the stop hook until completion.

## License

See the repository license.
