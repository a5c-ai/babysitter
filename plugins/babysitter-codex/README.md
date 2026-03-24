# babysitter-codex

Babysitter integration package for OpenAI Codex CLI. It packages Codex-facing
skills, install helpers, mapping docs, and the hook assets used to keep
Babysitter in the Codex lifecycle loop.

This is a Codex skill bundle plus workspace hook templates. It is not a
Claude-style manifest plugin, but it does rely on Codex's real lifecycle hook
engine through `.codex/hooks.json`.

## What This Package Owns

- Codex skill payload under `~/.codex/skills/babysitter-codex`
- Codex-facing command docs and install docs
- Codex runtime hook helpers under `.codex/`
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

Codex should be integrated through its real hook engine:

- `SessionStart` initializes Babysitter session state
- `UserPromptSubmit` handles prompt-time transformations safely
- `Stop` keeps Babysitter in the orchestration loop after each yielded turn

Current contract:

- start, resume, and inspect work through Codex command phrases such as
  `babysitter call`, `babysitter resume`, and `babysitter doctor`
- let the installed Codex hook assets handle runtime state, result posting,
  and continuation
- stop after each completed phase so the `Stop` hook can decide whether Codex
  exits or receives the next Babysitter iteration message
- finish only when `completionProof` is emitted and echoed as
  `<promise>...</promise>`

Do not document external supervisors, hidden wrapper loops, or `notify` as the
continuation mechanism for the plugin path.

## Installation

Install from npm:

```bash
npm install -g @a5c-ai/babysitter-codex
```

Or from a local checkout:

```bash
cd /path/to/babysitter-codex
npm install -g .
```

Verify the installed skill payload:

```bash
npm ls -g @a5c-ai/babysitter-codex --depth=0
ls -1 ~/.codex/skills/babysitter-codex
test -f ~/.codex/skills/babysitter-codex/scripts/team-install.js
test -f ~/.codex/skills/babysitter-codex/.codex/hooks.json
test -f ~/.codex/skills/babysitter-codex/.codex/hooks/babysitter-stop-hook.sh
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

For Codex users, the expected interface is the Codex command phrases plus the
workspace hook install created by onboarding. Raw Babysitter CLI primitives are
internal harness details and live in the Codex skill or maintainer docs, not in
this user-facing README.

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
