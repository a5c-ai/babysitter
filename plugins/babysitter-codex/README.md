# babysitter-codex

Babysitter integration package for OpenAI Codex CLI. It packages Codex-facing
skills, install helpers, mapping docs, and the runtime assets needed for the
Codex supervisor model.

This is a Codex skill bundle and integration package. It is not a native
Codex plugin in the Claude-style manifest or blocking-hook sense.

## What This Package Owns

- Codex skill payload under `~/.codex/skills/babysitter-codex`
- Codex-facing command docs and install docs
- Codex runtime helpers under `.codex/` and `bin/`
- Codex mapping and compatibility policy for SDK-driven orchestration

## Active Process-Library Model

`babysitter-codex` ships a bundled upstream snapshot, but that snapshot is not
the primary process-library contract.

Active-use process discovery should prefer layered roots in this order:

1. Project-local `.a5c/processes`
2. Repo-local Babysitter plugin roots when the workspace contains them
3. Installed skill/process roots under `~/.codex/skills/...`
4. Bundled upstream snapshot as fallback/reference content only

`project-install` and `team-install` layer config, rules, profiles, and pinned
content metadata. They should not be documented as creating an exclusive
project/team process-library scope.

## Codex User Experience

Codex does not expose Claude-style blocking stop hooks. Codex orchestration is
supervisor-owned and proceeds one turn at a time through persisted `.a5c` run
state plus the installed Codex skill payload.

Current contract:

- start, resume, and inspect work through Codex command phrases such as
  `babysitter call`, `babysitter resume`, and `babysitter doctor`
- execute at most one orchestration phase per turn
- let the installed Codex harness assets handle runtime state, result posting,
  and continuation
- stop after each completed phase so the supervisor can drive the next turn
- finish only when `completionProof` is emitted and echoed as
  `<promise>...</promise>`

Do not document hidden stop hooks, multi-iteration loops inside one turn, or
harness-owned `notify` as the continuation mechanism.

## Installation

Install from npm:

```bash
npm install -g @yaniv-tg/babysitter-codex
```

Or from a local checkout:

```bash
cd /path/to/babysitter-codex
npm install -g .
```

Verify the installed skill payload:

```bash
npm ls -g @yaniv-tg/babysitter-codex --depth=0
ls -1 ~/.codex/skills/babysitter-codex
test -f ~/.codex/skills/babysitter-codex/scripts/team-install.js
test -f ~/.codex/skills/babysitter-codex/.codex/turn-controller.js
```

For the fuller install runbook, see [docs/INSTALL.md](./docs/INSTALL.md).

## Quick Start

Use command phrases in Codex chat:

```text
babysitter help
babysitter call implement authentication with tests
babysitter yolo fix lint and failing tests
babysitter resume latest incomplete run
babysitter doctor current run
```

For Codex users, the expected interface is the Codex command phrases and the
installed skill payload. Raw Babysitter CLI primitives and turn-controller
mechanics are internal harness details and live in the Codex skill or command
implementation docs, not in this user-facing README.

## Project And Team Install

Use `babysitter team-install` and `babysitter project-install` from Codex chat
when you want workspace onboarding. They layer pinned config and setup around
the active process roots already used at runtime; they are not the source of
truth for process discovery.

## Documentation

- [docs/INSTALL.md](./docs/INSTALL.md)
- [docs/CODEX_MAPPING.md](./docs/CODEX_MAPPING.md)
- [commands/README.md](./commands/README.md)
- Internal orchestration details: [.codex/skills/babysitter/call/SKILL.md](./.codex/skills/babysitter/call/SKILL.md)
- Maintainer/operator runtime details: [docs/MAINTAINER_RUNBOOK.md](./docs/MAINTAINER_RUNBOOK.md)

## License

MIT
