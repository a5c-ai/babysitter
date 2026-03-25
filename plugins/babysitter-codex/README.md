# @a5c-ai/babysitter-codex

Babysitter integration package for OpenAI Codex CLI.

This package is a Codex skill bundle plus installer assets. It is not a native
Codex plugin manifest and it does not run an external orchestrator. The Codex
plugin path is:

- installed skill bundle under `~/.codex/skills/babysitter-codex`
- workspace `.codex/hooks.json`
- workspace `.codex/config.toml`
- workspace `.a5c/` state
- Babysitter SDK CLI for run creation, iteration, result posting, and
  process-library binding

## What This Package Installs

Global install copies the Codex-facing bundle into `CODEX_HOME`:

- `SKILL.md`
- `.codex/`
- `agents/`
- `commands/`
- `bin/`
- `scripts/`
- `babysitter.lock.json`

It does not bundle the process library.

## Integration Model

Babysitter for Codex uses only the hooks model:

- `SessionStart` seeds Babysitter session state
- `UserPromptSubmit` handles prompt-time transformations
- `Stop` yields continuation back into the Babysitter orchestration loop

The process library is fetched at workspace-install time through the SDK CLI and
bound for active use in `.a5c/active/process-library.json`.

## Installation

Install the SDK CLI first:

```bash
npm install -g @a5c-ai/babysitter-sdk
```

Install the Codex package:

```bash
npm install -g @a5c-ai/babysitter-codex
```

Then install the Codex plugin payload into the target workspace:

```bash
babysitter harness:install-plugin codex --workspace /path/to/repo
```

If `npm install -g @a5c-ai/babysitter-codex` is run from inside the target
workspace, `postinstall` will also auto-run the packaged `team-install.js`
against that workspace.

## What `team-install.js` Does

`scripts/team-install.js` is the workspace installer used by the package and by
`babysitter harness:install-plugin codex`.

It:

1. Resolves the installed package root.
2. Reads `babysitter.lock.json`.
3. Clones or updates the upstream Babysitter repo into
   `<workspace>/.a5c/process-library/babysitter-repo`.
4. Binds `<workspace>/.a5c/process-library/babysitter-repo/library` with
   `babysitter process-library:use`.
5. Writes `<workspace>/.a5c/active/process-library.json`.
6. Writes or refreshes `<workspace>/.codex/hooks.json`.
7. Creates or merges `<workspace>/.codex/config.toml` so the workspace has the
   required Codex settings.
8. Writes `<workspace>/.a5c/team/install.json`.
9. Creates `<workspace>/.a5c/team/profile.json` if it does not already exist.

It does not create an external orchestrator, bundle the process library, or
turn the workspace into a fake Codex plugin manifest.

## Resulting Workspace Files

After a successful workspace install, the important files are:

- `.codex/hooks.json`
- `.codex/config.toml`
- `.a5c/team/install.json`
- `.a5c/team/profile.json`
- `.a5c/active/process-library.json`
- `.a5c/process-library/babysitter-repo/library`

## Using It In Codex

Use normal Codex chat phrases:

```text
babysitter call implement authentication with tests
babysitter resume
babysitter doctor
babysitter team-install
babysitter project-install
```

The Codex skill and hooks own the plugin flow. Low-level SDK commands are still
the runtime mechanism, but they are not the user-facing interface.

## Verification

Verify the installed skill bundle:

```bash
npm ls -g @a5c-ai/babysitter-codex --depth=0
ls -1 ~/.codex/skills/babysitter-codex
test -f ~/.codex/skills/babysitter-codex/scripts/team-install.js
test -f ~/.codex/skills/babysitter-codex/.codex/hooks/babysitter-stop-hook.sh
```

Verify the active process-library binding for a workspace:

```bash
babysitter process-library:active --state-dir /path/to/repo/.a5c --json
```

## Docs

- [commands/README.md](./commands/README.md)
- Internal orchestration details: [.codex/skills/babysitter/call/SKILL.md](./.codex/skills/babysitter/call/SKILL.md)

## License

MIT
