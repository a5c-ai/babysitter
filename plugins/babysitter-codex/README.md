# @a5c-ai/babysitter-codex

Babysitter integration package for OpenAI Codex CLI. It packages Codex-facing
skills, install helpers, mapping docs, and the hook assets used to keep
Babysitter in the Codex lifecycle loop.

This is a Codex skill bundle plus workspace hook templates. It is not a
Claude-style manifest plugin, but it does rely on Codex's real lifecycle hook
engine through `.codex/hooks.json`, and the package postinstall now wires the
active workspace when the global install is launched from that workspace.

## What This Package Owns

- Codex skill payload under `~/.codex/skills/babysitter-codex`
- Codex-facing command docs
- Codex runtime hook helpers under `.codex/`
- Codex mapping and compatibility policy for SDK-driven orchestration

## Active Process-Library Model

`babysitter-codex` does not ship the process library. Workspace onboarding
fetches the original Babysitter repo through the SDK CLI and binds the active
process root in `.a5c/active/process-library.json`.

Active-use process discovery should prefer:

1. Project-local `.a5c/processes`
2. The SDK-managed active process-library binding returned by
   `babysitter process-library:active --state-dir .a5c --json`

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

If you run that command from inside the target repository, postinstall will:

- install the skill payload into `CODEX_HOME`
- merge `~/.codex/config.toml` so `codex_hooks` is enabled
- materialize workspace `.codex/hooks.json` and `.codex/config.toml` for the
  active workspace
- clone or update the original Babysitter repo into `.a5c/process-library/...`
- bind the fetched process-library root for active use through the SDK CLI

If you installed from somewhere else, run:

```bash
npm install -g @a5c-ai/babysitter-sdk
babysitter harness:install-plugin codex --workspace /path/to/repo
```

`babysitter harness:install-plugin ...` is provided by the SDK CLI, so make
sure `@a5c-ai/babysitter-sdk` is installed first.

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

Verify the active process-library binding:

```bash
babysitter process-library:active --state-dir /path/to/repo/.a5c --json
```

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
internal harness details and live in the Codex skill, not in this user-facing
README.

## Project And Team Install

Use `babysitter team-install` and `babysitter project-install` from Codex chat
when you want workspace onboarding. They layer pinned config and setup around
the active process roots already used at runtime; they are not the source of
truth for process discovery.

## Documentation

- [commands/README.md](./commands/README.md)
- Internal orchestration details: [.codex/skills/babysitter/call/SKILL.md](./.codex/skills/babysitter/call/SKILL.md)

## License

MIT
